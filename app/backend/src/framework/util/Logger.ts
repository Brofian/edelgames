import serverConfiguration from './ServerConfiguration';

export class Logger {
	constructor(section = 'SYSTEM') {
		this.section = section;
	}

	private section: string;

	private static readonly LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];

	private loggerInitialized = false;

	private static LOG_LEVEL: number;

	private initializeLogger(): void {
		if (!this.loggerInitialized) {
			Logger.LOG_LEVEL = serverConfiguration.logLevel;
			this.loggerInitialized = true;
		}
	}

	private log(logLevel: string, message: string, ...data: unknown[]): void {
		this.initializeLogger();
		if (Logger.LOG_LEVEL <= Logger.LOG_LEVELS.indexOf(logLevel)) {
			let dateString = new Date().toISOString().replace('T', ' ');
			dateString = dateString.substring(0, dateString.lastIndexOf('.'));
			console.log(
				`[${dateString}][${this.section.toUpperCase()}][${logLevel}] ${message}`,
				...data
			);
		}
	}

	public debug(message: string, ...data: unknown[]): void {
		this.log('DEBUG', message, ...data);
	}

	public info(message: string, ...data: unknown[]): void {
		this.log('INFO', message, ...data);
	}

	public warning(message: string, ...data: unknown[]): void {
		this.log('WARNING', message, ...data);
	}

	public error(message: string, ...data: unknown[]): void {
		this.log('ERROR', message, ...data);
	}
}

export const systemLogger = new Logger();
