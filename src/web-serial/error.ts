const READABLE_ERROR = new Error('Serial port is not readable')
const WRITABLE_ERROR = new Error('Serial port is not writable')
const SERIAL_PORT_NOT_FOUND_ERROR = new Error('Serial port not found')
const PLATFORM_ERROR = new Error(
	'Web Serial API is not supported in this platform',
)

export {
	PLATFORM_ERROR,
	READABLE_ERROR,
	SERIAL_PORT_NOT_FOUND_ERROR,
	WRITABLE_ERROR,
}
