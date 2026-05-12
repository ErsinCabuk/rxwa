import {
	from,
	fromEvent,
	map,
	merge,
	Observable,
	of,
	shareReplay,
	startWith,
	switchMap,
	throwError,
} from 'rxjs'
import {
	READABLE_ERROR,
	SERIAL_PORT_NOT_FOUND_ERROR,
	WRITABLE_ERROR,
} from './error'
import { getSerial } from './serial'
import type {
	SerialInputSignals,
	SerialOptions,
	SerialOutputSignals,
	SerialPort,
	SerialPortFilter,
	SerialPortInfo,
	SerialPortRequestOptions,
} from './type'

export abstract class BaseSerialPort {
	protected port?: SerialPort

	constructor(protected filter: SerialPortFilter) {}

	request(options?: SerialPortRequestOptions): Observable<this> {
		return getSerial().pipe(
			switchMap(serial =>
				from(serial.requestPort({ filters: [this.filter], ...options })),
			),
			map(port => {
				this.port = port
				return this
			}),
		)
	}

	get(): Observable<this> {
		return getSerial().pipe(
			switchMap(serial => from(serial.getPorts())),
			switchMap(ports => {
				const port = ports.find(port => {
					const info = port.getInfo()
					const filter = this.filter

					return (
						filter.bluetoothServiceClassId === undefined
						|| (info.bluetoothServiceClassId === filter.bluetoothServiceClassId
							&& filter.usbVendorId === undefined)
						|| (info.usbVendorId === filter.usbVendorId
							&& filter.usbProductId === undefined)
						|| info.usbProductId === filter.usbProductId
					)
				})

				if (!port) {
					return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
				}

				this.port = port
				return of(this)
			}),
		)
	}

	getInfo(): SerialPortInfo {
		if (!this.port) throw SERIAL_PORT_NOT_FOUND_ERROR
		return this.port?.getInfo()
	}

	open(options: SerialOptions): Observable<this> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return from(this.port.open(options)).pipe(map(() => this))
	}

	close(): Observable<this> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return from(this.port.close()).pipe(map(() => this))
	}

	forget(): Observable<this> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return from(this.port.forget()).pipe(map(() => this))
	}

	state(): Observable<boolean> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return merge(
			fromEvent(this.port, 'connect').pipe(map(() => true)),
			fromEvent(this.port, 'disconnect').pipe(map(() => false)),
		).pipe(
			startWith(this.port.connected),
			shareReplay({ bufferSize: 1, refCount: true }),
		)
	}

	protected getSignals(): Observable<SerialInputSignals> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return from(this.port.getSignals())
	}

	protected setSignals(options?: SerialOutputSignals): Observable<void> {
		if (!this.port) return throwError(() => SERIAL_PORT_NOT_FOUND_ERROR)
		return from(this.port.setSignals(options))
	}

	protected read(): Observable<Uint8Array> {
		return new Observable<Uint8Array>(subscriber => {
			if (!this.port) {
				subscriber.error(SERIAL_PORT_NOT_FOUND_ERROR)
				return
			}

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

	protected write(chunk: Uint8Array): Observable<void> {
		return new Observable<void>(subscriber => {
			if (!this.port) {
				subscriber.error(SERIAL_PORT_NOT_FOUND_ERROR)
				return
			}

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
}
