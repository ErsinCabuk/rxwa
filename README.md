# RXWA

**RXWA** is a lightweight, modern, and fully TypeScript-based library that wraps the Web API's as **RxJS Observables**.
It converts SignalR’s Promise-based and callback-based API into a reactive, composable model.

## Installation

```bash
bun install rxwa
```

```bash
npm install rxwa
```

## Usage

```ts
import { BaseSerialPort } from "rxwa/web-serial";

export class XCardReaderAndWriter extends BaseSerialPort {
  writeMode() {
    const command = new Uint8Array([...])
    return this.write(command)
  }

  readCard() {
    return this.read()
      .pipe(
        // mapping
        // flows
        // etc.
      )
  }
}
```
