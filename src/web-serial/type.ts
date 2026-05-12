type BluetoothServiceUUID = string | number

type ParityType = 'none' | 'even' | 'odd'
type FlowControlType = 'none' | 'hardware'

interface SerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
  bluetoothServiceClassId?: BluetoothServiceUUID
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: ParityType
  bufferSize?: number
  flowControl?: FlowControlType
}

interface SerialOutputSignals {
  dataTerminalReady?: boolean
  requestToSend?: boolean
  break?: boolean
}

interface SerialInputSignals {
  dataCarrierDetect: boolean
  clearToSend: boolean
  ringIndicator: boolean
  dataSetReady: boolean
}

interface SerialPort extends EventTarget {
  readonly connected: boolean
  readonly readable?: ReadableStream<Uint8Array>
  readonly writable?: WritableStream<Uint8Array>
  getInfo(): SerialPortInfo
  open(options: SerialOptions): Promise<void>
  setSignals(signals?: SerialOutputSignals): Promise<void>
  getSignals(): Promise<SerialInputSignals>
  close(): Promise<void>
  forget(): Promise<void>
}

interface SerialPortFilter {
  bluetoothServiceClassId?: BluetoothServiceUUID
  usbVendorId?: number
  usbProductId?: number
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
  allowedBluetoothServiceClassIds?: BluetoothServiceUUID[]
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
}

declare global {
  interface Navigator {
    serial?: Serial
  }
}

export type {
  BluetoothServiceUUID,
  FlowControlType,
  ParityType,
  Serial,
  SerialInputSignals,
  SerialOptions,
  SerialOutputSignals,
  SerialPort,
  SerialPortFilter,
  SerialPortInfo,
  SerialPortRequestOptions,
}
