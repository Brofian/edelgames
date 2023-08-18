import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
	path: path.resolve(__dirname + '/./../../../.env'),
});

const server = {
	apiPort: Number.parseInt(process.env.API_HTTP_PORT) || undefined,
	reactPort: Number.parseInt(process.env.REACT_HTTP_PORT) || undefined,
	reactDomain: process.env.REACT_APP_DOMAIN || 'http://localhost',
	apiDisconnectTimeoutSec:
		Number.parseInt(process.env.API_DISCONNECT_TIMEOUT) || 60,
	debugLogin: process.env.API_DEBUG_LOGIN || false,
	logLevel: (Number.parseInt(process.env.LOG_LEVEL) || undefined) ?? 0,
};
export default server;
