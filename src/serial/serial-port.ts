import { concatMap, map, Observable, of, tap, throwError } from "rxjs";
import { promiseToObservable } from "../util";
import { BaseSerial } from "./serial";
import type { SerialPort, SerialPortGetSignals, SerialPortInfo, SerialPortOpenOptions, SerialPortSetSignals, SerialRequestPortOptions, SerialRequestPortOptionsFilter } from "./type";

export class BaseSerialPort {
  private _port?: SerialPort

  private get port(): SerialPort {
    if (!this._port) {
      throw Errors.NOT_SET()
    }

    return this._port;
  }

  private _readable?: ReadableStream<Uint8Array>

  private get readable(): ReadableStream<Uint8Array> {
    if (!this._readable) {
      throw Errors.NOT_SET()
    }

    return this._readable;
  }

  private _writable?: WritableStream<Uint8Array>

  private get writable(): WritableStream<Uint8Array> {
    if (!this._writable) {
      throw Errors.NOT_SET()
    }

    return this._writable;
  }

  private _writer?: WritableStreamDefaultWriter<Uint8Array>

  private get writer(): WritableStreamDefaultWriter<Uint8Array> {
    if (!this._writer) {
      throw Errors.WRITER_NOT_CREATED()
    }

    return this._writer;
  }

  get(options: SerialRequestPortOptionsFilter): Observable<this> {
    return BaseSerial.getPorts()
      .pipe(
        concatMap(ports => {
          ports = ports.filter(port => {
            const info = port.getInfo()
            return info.usbVendorId == options.usbVendorId || info.usbProductId == options.usbProductId || info.bluetoothServiceClassId == options.bluetoothServiceClassId
          })

          if (ports.length == 0) {
            return throwError(Errors.NOT_FOUND)
          }

          else if (ports.length > 1) {
            return throwError(Errors.MULTIPLE_FOUND)
          }

          else {
            this._port = ports[0]
            return of(this)
          }
        }),
      )
  }

  request(options?: SerialRequestPortOptions): Observable<this> {
    return BaseSerial.requestPort(options)
      .pipe(
        map(port => {
          this._port = port
          return this;
        })
      )
  }

  open(options: SerialPortOpenOptions): Observable<this> {
    return promiseToObservable(
      this.port.open(options)
    )
    .pipe(
      tap(() => {
        this._readable = this.port.readable
        this._writable = this.port.writable
      }),
      map(() => this)
    )
  }

  close(): Observable<this> {
    return promiseToObservable(
      this.port.close()
    )
    .pipe(
      tap(() => {
        this._readable = undefined
        this._writable = undefined
      }),
      map(() => this)
    )
  }

  forget(): Observable<this> {
    return promiseToObservable(
      this.port.forget()
    )
    .pipe(
      tap(() => {
        this._port = undefined
        this._readable = undefined
        this._writable = undefined
      }),
      map(() => this)
    )
  }

  read(): Observable<Uint8Array> {
    const reader = this.readable.getReader()

    return new Observable<Uint8Array>(subscriber => {
      let is = true

      async function loop() {
        try {
          while (is) {
            const { value, done } = await reader.read()

            if (done) {
              subscriber.complete()
              break;
            }

            subscriber.next(value)
          }
        } catch (error) {
          subscriber.error(error)
        } finally {
          reader.releaseLock()
        }
      }

      loop()

      return () => {
        is = false
        reader
          .cancel()
          .catch(() => {})
        reader.releaseLock()
      }
    })
  }

  createWriter(): Observable<WritableStreamDefaultWriter<Uint8Array>> {
    return promiseToObservable(
      new Promise((resolve, reject) => {
        try {
          if (!this._writer) {
            this._writer = this.writable.getWriter()
          }

          resolve(this._writer)
        } catch (error) {
          reject(error)
        }
      })
    )
  }

  destroyWriter(): Observable<void> {
    return promiseToObservable(
      new Promise((resolve, reject) => {
        try {
          if (!this._writer) return;

          this._writer.releaseLock()
          this._writer = undefined

          resolve()
        } catch (error) {
          reject(error)
        }
      })
    )
  }

  write(data: Uint8Array): Observable<this> {
    return promiseToObservable(
      this.writer.write(data)
    )
    .pipe(
      map(() => this)
    )
  }

  getInfo(): SerialPortInfo {
    return this.port.getInfo()
  }

  setSignals(signals: SerialPortSetSignals): Observable<this> {
    return promiseToObservable(
      this.port.setSignals(signals)
    )
    .pipe(
      map(() => this)
    )
  }

  getSignals(): Observable<SerialPortGetSignals> {
    return promiseToObservable(
      this.port.getSignals()
    )
  }

  onConnect(): Observable<Event> {
    return new Observable(subscriber => {
      function listener(event: Event) {
        subscriber.next(event)
      }

      this.port.addEventListener("connect", listener)

      return () => {
        this.port.removeEventListener("connect", listener)
      }
    });
  }

  onDisconnect(): Observable<Event> {
    return new Observable(subscriber => {
      function listener(event: Event) {
        subscriber.next(event)
      }

      this.port.addEventListener("disconnect", listener)

      return () => {
        this.port.removeEventListener("disconnect", listener)
      }
    });
  }
}

const Errors = {
  NOT_SET: () => new Error("SerialPort not set."),
  NOT_FOUND: () => new Error("SerialPort not found."),
  MULTIPLE_FOUND: () => new Error("Multiple SerialPorts found."),
  WRITER_NOT_CREATED: () => new Error("SerialPort writer not created."),
}
