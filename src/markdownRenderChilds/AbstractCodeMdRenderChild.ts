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
	console: LogEntry[];
	input: string;
	running: boolean;
	language: Language;
}

export enum Language {
	JS = 'js',
	PYTHON = 'python',
	CMD = 'bash',
	OCTAVE = 'matlab',

	UNDEFINED = 'undefined',
}

export class PseudoConsole {
	out: LogEntry[];
	onLogCallback: (LogEntry: LogEntry) => void = () => {};

	constructor() {
		this.out = [];
	}

	onLog(callback: (LogEntry: LogEntry) => void) {
		this.onLogCallback = callback;
	}

	debug(...obj: any[]) {
		const logEntry: LogEntry = {
			level: LogLevel.TRACE,
			message: obj
				.map(x => {
					if (typeof x === 'string') {
						return x;
					} else {
						return JSON.stringify(x, null, 4);
					}
				})
				.join(' '),
		};

		this.onLogCallback(logEntry);
		this.out.push(logEntry);
	}

	log(...obj: any[]) {
		const logEntry: LogEntry = {
			level: LogLevel.INFO,
			message: obj
				.map(x => {
					if (typeof x === 'string') {
						return x;
					} else {
						return JSON.stringify(x, null, 4);
					}
				})
				.join(' '),
		};

		this.onLogCallback(logEntry);
		this.out.push(logEntry);
	}

	warn(...obj: any[]) {
		const logEntry: LogEntry = {
			level: LogLevel.WARN,
			message: obj
				.map(x => {
					if (typeof x === 'string') {
						return x;
					} else {
						return JSON.stringify(x, null, 4);
					}
				})
				.join(' '),
		};

		this.onLogCallback(logEntry);
		this.out.push(logEntry);
	}

	error(...obj: any[]) {
		const logEntry: LogEntry = {
			level: LogLevel.ERROR,
			message: obj
				.map(x => {
					if (typeof x === 'string') {
						return x;
					} else {
						return JSON.stringify(x, null, 4);
					}
				})
				.join(' '),
		};

		this.onLogCallback(logEntry);
		this.out.push(logEntry);
	}
}

export abstract class AbstractCodeMdRenderChild extends MarkdownRenderChild {
	plugin: ScriptRunnerPlugin;
	data: CodeMdRenderChildData;
	file: string;
	component: CodeMdRenderChildComponent;
	readonly idFieldName: string = 'script-id';

	protected constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string) {
		super(containerEl);
		this.plugin = plugin;

		this.data = {
			id: undefined,
			idError: undefined,
			content: fullDeclaration,
			console: [],
			input: '',
			running: false,
			language: Language.UNDEFINED,
		};
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

	protected setLanguage(language: Language) {
		this.data.language = language;
	}

	clearConsole() {
		this.data.console = [];
	}

	abstract runProcess(): Promise<void>;

	abstract killProcess(reason: Error | string): Promise<boolean>;

	abstract sendToProcess(data: string): Promise<void>;

	abstract canSendToProcess(): boolean;

	abstract canKillProcess(): boolean;

	public onload(): void {
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
			},
		});
	}
}
