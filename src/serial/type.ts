interface Serial extends EventTarget {
  requestPort: (options?: SerialRequestPortOptions) => Promise<SerialPort>
  getPorts: () => Promise<SerialPorts>
}

interface SerialRequestPortOptions {
  filters?: SerialRequestPortOptionsFilters
  allowedBluetoothServiceClassIds?: number[]
}

interface SerialRequestPortOptionsFilter {
  bluetoothServiceClassId?: number
  usbVendorId?: number
  usbProductId?: number
}

type SerialRequestPortOptionsFilters = SerialRequestPortOptionsFilter[]

interface SerialPort extends EventTarget {
  readonly connected: boolean
  readonly readable: ReadableStream
  readonly writable: WritableStream
  forget: () => Promise<undefined>
  getInfo: () => SerialPortInfo
  open: (options: SerialPortOpenOptions) => Promise<undefined>
  setSignals: (options?: SerialPortSetSignals) => Promise<undefined>
  getSignals: () => Promise<SerialPortGetSignals>
  close: () => Promise<undefined>
}

type SerialPorts = SerialPort[]

interface SerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
  bluetoothServiceClassId?: number
}

interface SerialPortOpenOptions {
  baudRate: number
  bufferSize?: number
  dataBits?: number
  flowControl?: 'none' | 'hardware'
  parity?: 'none' | 'even' | 'odd'
  stopBits?: 1 | 2
}

interface SerialPortSetSignals {
  dataTerminalReady: boolean
  requestToSend: boolean
  break: boolean
}

interface SerialPortGetSignals {
  clearToSend: boolean
  dataCarrierDetect: boolean
  dataSetReady: boolean
  ringIndicator: boolean
}

export type { Serial, SerialPort, SerialPortGetSignals, SerialPortInfo, SerialPortOpenOptions, SerialPorts, SerialPortSetSignals, SerialRequestPortOptions, SerialRequestPortOptionsFilter, SerialRequestPortOptionsFilters }
