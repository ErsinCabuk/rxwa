import {
	from,
	fromEvent,
	map,
	merge,
	Observable,
	shareReplay,
	startWith,
} from 'rxjs'
import { READABLE_ERROR, WRITABLE_ERROR } from './error'
import type {
	SerialInputSignals,
	SerialOptions,
	SerialOutputSignals,
	SerialPort,
	SerialPortInfo,
} from './type'

export class ReactiveSerialPort {
	constructor(protected port: SerialPort) {}

	getInfo(): SerialPortInfo {
		return this.port.getInfo()
	}

	open(options: SerialOptions): Observable<void> {
		return from(this.port.open(options))
	}

	close(): Observable<void> {
		return from(this.port.close())
	}

	forget(): Observable<void> {
		return from(this.port.forget())
	}

	getSignals(): Observable<SerialInputSignals> {
		return from(this.port.getSignals())
	}

	setSignals(options?: SerialOutputSignals): Observable<void> {
		return from(this.port.setSignals(options))
	}

	read(): Observable<Uint8Array> {
		return new Observable<Uint8Array>(subscriber => {
			if (!this.port.readable) {
				subscriber.error(READABLE_ERROR)
				return
			}

			const reader = this.port.readable.getReader()
			let is = true

			function next() {
				reader
					.read()
					.then(({ value, done }) => {
						if (done) {
							subscriber.complete()
							return
						}

						subscriber.next(value)
					})
					.catch(error => {
						subscriber.error(error)
					})
					.finally(() => {
						if (is) next()
					})
			}

			next()

			return () => {
				is = false
				reader.cancel().catch(() => {
					console.error('Failed to cancel the reader')
				})
			}
		})
	}

	write(chunk: Uint8Array): Observable<void> {
		return new Observable<void>(subscriber => {
			if (!this.port.writable) {
				subscriber.error(WRITABLE_ERROR)
				return
			}

			const writer = this.port.writable.getWriter()

			writer
				.write(chunk)
				.then(() => {
					subscriber.next()
					subscriber.complete()
				})
				.catch(error => {
					subscriber.error(error)
				})
				.finally(() => {
					writer.releaseLock()
				})
		})
	}

	state(): Observable<boolean> {
		return merge(
			fromEvent(this.port, 'connect').pipe(map(() => true)),
			fromEvent(this.port, 'disconnect').pipe(map(() => false)),
		).pipe(
			startWith(this.port.connected),
			shareReplay({ bufferSize: 1, refCount: true }),
		)
	}
}
