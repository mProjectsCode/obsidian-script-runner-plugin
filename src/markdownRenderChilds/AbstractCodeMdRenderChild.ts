import { MarkdownRenderChild } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import CodeMdRenderChildComponent from './CodeMdRenderChildComponent.svelte';
import { getPlaceholderUUID } from '../utils/Utils';

export enum LogLevel {
	TRACE,
	INFO,
	WARN,
	ERROR,
}

export interface LogEntry {
	level: LogLevel;
	message: string;
}

export interface CodeMdRenderChildData {
	id: string | undefined;
	idError: string | undefined;
	content: string;
	input: string;
	running: boolean;
	hasRun: boolean;
	language: Language;
	saveData: CodeMdRenderChildSaveData;
}

export interface CodeMdRenderChildSaveData {
	id: string | undefined;
	console: LogEntry[];
	executionPath?: {
		mode: PathMode;
		path: string;
	};
}

export enum PathMode {
	RELATIVE = 'relative',
	VAULT_RELATIVE = 'vault_relative',
	ABSOLUTE = 'absolute',
}

export enum Language {
	JS = 'js',
	PYTHON = 'python',
	CMD = 'bash',
	OCTAVE = 'matlab',

	UNDEFINED = 'undefined',
}

export class PseudoConsole {
	onLogCallback: (LogEntry: LogEntry) => void = (): void => {};

	onTraceCallback: (LogEntry: LogEntry) => void = (): void => {};
	onInfoCallback: (LogEntry: LogEntry) => void = (): void => {};
	onWarnCallback: (LogEntry: LogEntry) => void = (): void => {};
	onErrorCallback: (LogEntry: LogEntry) => void = (): void => {};

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

export abstract class AbstractCodeMdRenderChild extends MarkdownRenderChild {
	plugin: ScriptRunnerPlugin;
	data: CodeMdRenderChildData;
	file: string;
	component: CodeMdRenderChildComponent;
	readonly idFieldName: string = 'script-id';

	protected constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, language: Language) {
		super(containerEl);
		this.plugin = plugin;

		this.data = {
			id: undefined,
			idError: undefined,
			content: fullDeclaration,
			input: '',
			running: false,
			hasRun: false,
			language: language,
			saveData: {} as CodeMdRenderChildSaveData,
		};

		this.parseId();
		this.loadData();
	}

	getDefaultCodeMdRenderChildSaveData(): CodeMdRenderChildSaveData {
		return {
			id: this.data.id,
			console: [],
			executionPath: {
				mode: PathMode.RELATIVE,
				path: '',
			},
		};
	}

	loadData(): void {
		console.log(`OSR | loaded data for ${this.data.id}`);
		this.data.saveData = this.plugin.settings.codeMdRenderChildSaveData.find(x => x.id === this.data.id) ?? this.getDefaultCodeMdRenderChildSaveData();
	}

	async saveData(): Promise<void> {
		console.log(`OSR | saved data for ${this.data.id}`);
		this.plugin.settings.codeMdRenderChildSaveData = this.plugin.settings.codeMdRenderChildSaveData.filter(x => x.id !== this.data.id);
		this.plugin.settings.codeMdRenderChildSaveData.push(this.data.saveData);
		await this.plugin.saveSettings();
	}

	abstract getCommentString(): string;

	getIdCommentPlaceholder(): string {
		return `${this.getCommentString()} ${this.idFieldName}: ${getPlaceholderUUID()}`;
	}

	private getIdFromComment(): string {
		if (!this.data) {
			throw Error('can not get id comment, data is undefined');
		}

		if (!this.data.content) {
			throw Error('can not get id comment, content is undefined or empty');
		}

		const rows: string[] = this.data.content.split('\n');

		if (rows.length === 0) {
			throw Error('can not get id comment, content is empty');
		}

		const line: string = rows[0].trim();

		if (!line) {
			throw Error('can not get id comment, the first line is empty');
		}

		if (!line.startsWith(this.getCommentString())) {
			throw Error('can not get id comment, the first line not a comment');
		}

		let id: string = line.slice(this.getCommentString().length).trim();

		if (!id.startsWith(this.idFieldName)) {
			throw Error(`can not get id comment, the comment does not start with '${this.idFieldName}'`);
		}

		id = id.slice(this.idFieldName.length).trim();

		if (!id.startsWith(':')) {
			throw Error(`can not get id comment, parsing error, ':' expected`);
		}

		id = id.slice(1).trim();

		if (!id) {
			throw Error(`can not get id comment, id is empty`);
		}

		return id;
	}

	protected parseId(): void {
		try {
			this.data.id = this.getIdFromComment();
			this.data.idError = undefined;
		} catch (e) {
			this.data.id = undefined;
			this.data.idError = e.message;
		}
	}

	protected setLanguage(language: Language): void {
		this.data.language = language;
	}

	clearConsole(): void {
		this.data.saveData.console = [];
	}

	onProcessStart(): void {
		this.data.running = true;
		this.component.update();
	}

	createPseudoConsole(addNewline: boolean = false): PseudoConsole {
		const pseudoConsole = new PseudoConsole(addNewline);
		pseudoConsole.onTrace(this.onProcessTrace.bind(this));
		pseudoConsole.onInfo(this.onProcessInfo.bind(this));
		pseudoConsole.onWarn(this.onProcessWarn.bind(this));
		pseudoConsole.onError(this.onProcessError.bind(this));

		return pseudoConsole;
	}

	onProcessTrace(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.onProcessLog({
				level: LogLevel.TRACE,
				message: message,
			});
		} else {
			this.onProcessLog(message);
		}
	}

	onProcessInfo(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.onProcessLog({
				level: LogLevel.INFO,
				message: message,
			});
		} else {
			this.onProcessLog(message);
		}
	}

	onProcessWarn(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.onProcessLog({
				level: LogLevel.WARN,
				message: message,
			});
		} else {
			this.onProcessLog(message);
		}
	}

	onProcessError(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.onProcessLog({
				level: LogLevel.ERROR,
				message: message,
			});
		} else {
			this.onProcessLog(message);
		}
	}

	onProcessLog(logEntry: LogEntry): void {
		console.debug(`OSR | process ${this.data.id} logged ${logEntry.level}`, logEntry.message);
		this.data.saveData.console.push(logEntry);
		this.component.updateConsole();
	}

	onProcessEnd(code: number | undefined | null): void {
		if (code !== undefined) {
			const data = `\n\nprocess exited with code ${code ?? 0}`;
			this.onProcessTrace(data);
		}
		this.data.running = false;
		this.saveData();
		this.component.update();
	}

	abstract runProcess(): Promise<void>;

	abstract killProcess(reason: Error | string): Promise<boolean>;

	abstract sendToProcess(data: string): Promise<void>;

	abstract canSendToProcess(): boolean;

	abstract canKillProcess(): boolean;

	public onload(): void {
		console.log(this.data);
		this.component = new CodeMdRenderChildComponent({
			target: this.containerEl,
			props: {
				data: this.data,
				idCommentPlaceholder: this.getIdCommentPlaceholder(),
				sendToProcess: this.sendToProcess.bind(this),
				runProcess: this.runProcess.bind(this),
				killProcess: this.killProcess.bind(this),
				canSendToProcess: this.canSendToProcess(),
				canKillProcess: this.canKillProcess(),
				save: this.saveData.bind(this),
			},
		});
	}
}
