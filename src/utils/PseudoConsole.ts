export const LogLevel = {
	TRACE: 'trace',
	INFO: 'info',
	WARN: 'warn',
	ERROR: 'error',
} as const;
type LogLevel = typeof LogLevel[keyof typeof LogLevel];
export const logLevelRecord = {
	[LogLevel.TRACE]: 'script-runner-trace-console',
	[LogLevel.INFO]: 'script-runner-info-console',
	[LogLevel.WARN]: 'script-runner-warn-console',
	[LogLevel.ERROR]: 'script-runner-error-console',
} as const satisfies { [k in LogLevel]: string };

export interface LogEntry {
	level: LogLevel;
	message: string;
}

export class PseudoConsole {
	onLogCallback: (LogEntry: LogEntry) => void = (): void => {
	};

	onTraceCallback: (LogEntry: LogEntry) => void = (): void => {
	};
	onInfoCallback: (LogEntry: LogEntry) => void = (): void => {
	};
	onWarnCallback: (LogEntry: LogEntry) => void = (): void => {
	};
	onErrorCallback: (LogEntry: LogEntry) => void = (): void => {
	};

	addNewline: boolean;

	constructor(addNewline: boolean) {
		this.addNewline = addNewline;
	}

	onLog(callback: (LogEntry: LogEntry) => void): void {
		this.onLogCallback = callback;
	}

	onTrace(callback: (LogEntry: LogEntry) => void): void {
		this.onTraceCallback = callback;
	}

	onInfo(callback: (LogEntry: LogEntry) => void): void {
		this.onInfoCallback = callback;
	}

	onWarn(callback: (LogEntry: LogEntry) => void): void {
		this.onWarnCallback = callback;
	}

	onError(callback: (LogEntry: LogEntry) => void): void {
		this.onErrorCallback = callback;
	}

	debug(...obj: any[]): void {
		const logEntry: LogEntry = {
			level: LogLevel.TRACE,
			message:
				obj
					.map(x => {
						if (typeof x === 'string') {
							return x;
						} else {
							return JSON.stringify(x, null, 4);
						}
					})
					.join(' ') + (this.addNewline ? '\n' : ''),
		};

		this.onLogCallback(logEntry);
		this.onTraceCallback(logEntry);
	}

	log(...obj: any[]): void {
		const logEntry: LogEntry = {
			level: LogLevel.INFO,
			message:
				obj
					.map(x => {
						if (typeof x === 'string') {
							return x;
						} else {
							return JSON.stringify(x, null, 4);
						}
					})
					.join(' ') + (this.addNewline ? '\n' : ''),
		};

		this.onLogCallback(logEntry);
		this.onInfoCallback(logEntry);
	}

	info(...obj: any[]): void {
		this.log(...obj);
	}

	warn(...obj: any[]): void {
		const logEntry: LogEntry = {
			level: LogLevel.WARN,
			message:
				obj
					.map(x => {
						if (typeof x === 'string') {
							return x;
						} else {
							return JSON.stringify(x, null, 4);
						}
					})
					.join(' ') + (this.addNewline ? '\n' : ''),
		};

		this.onLogCallback(logEntry);
		this.onWarnCallback(logEntry);
	}

	error(...obj: any[]): void {
		const logEntry: LogEntry = {
			level: LogLevel.ERROR,
			message:
				obj
					.map(x => {
						if (typeof x === 'string') {
							return x;
						} else {
							return JSON.stringify(x, null, 4);
						}
					})
					.join(' ') + (this.addNewline ? '\n' : ''),
		};

		this.onLogCallback(logEntry);
		this.onErrorCallback(logEntry);
	}
}
