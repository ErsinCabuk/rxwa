import type { Observable } from 'rxjs'
import { from, map, of, switchMap, throwError } from 'rxjs'
import { PLATFORM_ERROR } from './error'
import { ReactiveSerialPort } from './port'
import type { Serial, SerialPortRequestOptions } from './type'

function getSerial(): Observable<Serial> {
	if (!navigator?.serial) return throwError(() => PLATFORM_ERROR)
	return of(navigator.serial)
}

function getPorts(): Observable<ReactiveSerialPort[]> {
	return getSerial().pipe(
		switchMap(serial => from(serial.getPorts())),
		map(ports => ports.map(port => new ReactiveSerialPort(port))),
	)
}

function requestPort(
	options?: SerialPortRequestOptions,
): Observable<ReactiveSerialPort> {
	return getSerial().pipe(
		switchMap(serial => from(serial.requestPort(options))),
		map(port => new ReactiveSerialPort(port)),
	)
}

export { getPorts, getSerial, requestPort }
