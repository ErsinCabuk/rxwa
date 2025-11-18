import { Observable } from "rxjs";

export function promiseToObservable<T>(promise: Promise<T>) {
  return new Observable<T>(subscriber => {
    promise
      .then((result) => {
        subscriber.next(result)
        subscriber.complete()
      })
      .catch((error) => {
        subscriber.error(error)
      })
  });
}
