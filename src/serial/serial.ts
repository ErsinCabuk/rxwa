import { Observable } from "rxjs";
import { promiseToObservable } from "../util";
import type { SerialPort, SerialPorts, SerialRequestPortOptions } from "./type";

export class BaseSerial {
  static getPorts(): Observable<SerialPorts> {
    return promiseToObservable(
      navigator.serial.getPorts()
    );
  }

  static requestPort(options?: SerialRequestPortOptions): Observable<SerialPort> {
    return promiseToObservable(
      navigator.serial.requestPort(options)
    );
  }

  static onConnect(): Observable<Event> {
    return new Observable(subscriber => {
      function listener(event: Event) {
        subscriber.next(event);
      };

      navigator.serial.addEventListener("connect", listener);

      return () => {
        navigator.serial.removeEventListener("connect", listener);
      }
    });
  }

  static onDisconnect(): Observable<Event> {
    return new Observable(subscriber => {
      function listener(event: Event) {
        subscriber.next(event);
      };

      navigator.serial.addEventListener("disconnect", listener);

      return () => {
        navigator.serial.removeEventListener("disconnect", listener);
      }
    });
  }
}
