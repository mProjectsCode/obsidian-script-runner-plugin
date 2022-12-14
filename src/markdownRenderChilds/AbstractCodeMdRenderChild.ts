import { MarkdownRenderChild, normalizePath, TFile } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import CodeMdRenderChildComponent from './CodeMdRenderChildComponent.svelte';
import { getActiveFile, getPlaceholderUUID, getVaultBasePath, ScriptRunnerInternalError } from '../utils/Utils';
import * as path from 'path';
import { LogEntry, LogLevel, PseudoConsole } from '../utils/PseudoConsole';
import { Language } from '../scriptRunners/AbstractScriptRunner';

export interface CodeMdRenderChildData {
	id: string | undefined;
	idError: string | undefined;
	content: string;
	input: string;
	isRunning: boolean;
	hasRun: boolean;
	language: Language;
	saveData: CodeMdRenderChildSaveData;
}

export interface CodeMdRenderChildSaveData {
	id: string | undefined;
	console: LogEntry[];
	executionPath: {
		mode: PathMode;
		path: string;
	};
}

export enum PathMode {
	RELATIVE = 'relative',
	VAULT_RELATIVE = 'vault_relative',
}

export const commentStringRecord = {
	[Language.JS]: '//',
	[Language.PYTHON]: '#',
	[Language.CMD]: '#',
	[Language.OCTAVE]: '%',

	[Language.UNDEFINED]: undefined,
} as const satisfies { [k in Language]: string | undefined };

export const fileEndingRecord = {
	[Language.JS]: undefined,
	[Language.PYTHON]: 'py',
	[Language.CMD]: undefined,
	[Language.OCTAVE]: 'm',

	[Language.UNDEFINED]: undefined,
} as const satisfies { [k in Language]: string | undefined };

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
			input: '',
			isRunning: false,
			hasRun: false,
			language: this.getLanguage(),
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
		this.data.saveData = this.plugin.settings.codeMdRenderChildSaveData.find(x => x.id === this.data.id) ?? this.getDefaultCodeMdRenderChildSaveData();
		console.log(`OSR | loaded data for ${this.data.id}`, this.data.saveData);
	}

	async saveData(): Promise<void> {
		console.log(`OSR | saved data for ${this.data.id}`, this.data.saveData);
		this.plugin.settings.codeMdRenderChildSaveData = this.plugin.settings.codeMdRenderChildSaveData.filter(x => x.id !== this.data.id);
		this.plugin.settings.codeMdRenderChildSaveData.push(this.data.saveData);
		await this.plugin.saveSettings();
	}

	abstract getLanguage(): Language;

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

	getExecutionPath(): { vaultRelativePath: string; absolutePath: string } {
		let vaultRelativePath: string = '';
		if (this.data.saveData.executionPath.mode === PathMode.RELATIVE) {
			vaultRelativePath = path.join(getActiveFile()?.parent?.path ?? '', this.data.saveData.executionPath.path);
		} else if (this.data.saveData.executionPath.mode === PathMode.VAULT_RELATIVE) {
			vaultRelativePath = this.data.saveData.executionPath.path;
		}

		return { vaultRelativePath: vaultRelativePath, absolutePath: path.join(getVaultBasePath(), vaultRelativePath) };
	}

	getExecutionFilePath(vaultRelativePath: string, absolutePath: string): { vaultRelativePath: string; absolutePath: string } {
		vaultRelativePath = path.join(vaultRelativePath, this.getExecutionFileName());
		absolutePath = path.join(absolutePath, this.getExecutionFileName());

		return { vaultRelativePath: vaultRelativePath, absolutePath: absolutePath };
	}

	getExecutionFileName(): string {
		if (!this.data.id) {
			throw new ScriptRunnerInternalError('can not get execution file name, id is undefined');
		}

		const fileEnding = this.getFileEnding();
		if (!fileEnding) {
			throw new ScriptRunnerInternalError('can not get execution file name, file ending is undefined');
		}

		return `${this.getLanguage()}_${this.data.id.replaceAll('-', '_')}.${fileEnding}`;
	}

	getFileEnding(): string {
		const fileEnding = fileEndingRecord[this.data.language];
		if (!fileEnding) {
			throw new ScriptRunnerInternalError('can not get file ending, file ending for language is undefined');
		}
		return fileEnding;
	}

	getCommentString(): string {
		const commentString = commentStringRecord[this.data.language];
		if (!commentString) {
			throw new ScriptRunnerInternalError('can not get comment string, comment string for language is undefined');
		}
		return commentString;
	}

	async createExecutionFile(content: string): Promise<{ tFile: TFile; vaultRelativeFilePath: string; absoluteFilePath: string }> {
		const folderPath = this.getExecutionPath();
		const filePath = this.getExecutionFilePath(folderPath.vaultRelativePath, folderPath.absolutePath);

		let tFile: TFile = this.plugin.app.vault.getAbstractFileByPath(normalizePath(filePath.vaultRelativePath)) as TFile;
		if (tFile) {
			console.log(`OSR | modifying execution file ${filePath.vaultRelativePath} for ${this.data.id}`);
			await this.plugin.app.vault.modify(tFile, content);
		} else {
			console.log(`OSR | creating execution file ${filePath.vaultRelativePath} for ${this.data.id}`);
			tFile = await this.plugin.app.vault.create(filePath.vaultRelativePath, content);
		}
		return {
			tFile: tFile,
			vaultRelativeFilePath: filePath.vaultRelativePath,
			absoluteFilePath: filePath.absolutePath,
		};
	}

	async deleteExecutionFile(file: TFile): Promise<void> {
		console.log(`OSR | deleting execution file ${file.path} for ${this.data.id}`);
		await this.plugin.app.vault.delete(file);
	}

	createPseudoConsole(addNewline: boolean = false): PseudoConsole {
		const pseudoConsole = new PseudoConsole(addNewline);
		pseudoConsole.onTrace(this.onProcessTrace.bind(this));
		pseudoConsole.onInfo(this.onProcessInfo.bind(this));
		pseudoConsole.onWarn(this.onProcessWarn.bind(this));
		pseudoConsole.onError(this.onProcessError.bind(this));

		return pseudoConsole;
	}

	clearConsole(): void {
		this.data.saveData.console = [];
	}

	onProcessStart(): void {
		this.data.isRunning = true;
		this.data.hasRun = true;
		this.component.update();
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
		this.data.isRunning = false;
		this.saveData();
		this.component.update();
	}

	abstract runProcess(): Promise<void>;

	abstract killProcess(reason: Error | string): Promise<boolean>;

	abstract sendToProcess(data: string): Promise<void>;

	abstract canSendToProcess(): boolean;

	abstract canKillProcess(): boolean;

	abstract canConfigureExecutionPath(): boolean;

	public onload(): void {
		console.log(this.data);
		const c = new PseudoConsole(false);
		c.onInfo(console.log.bind(this));

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
				canConfigureExecutionPath: this.canConfigureExecutionPath(),
				saveData: this.saveData.bind(this),
			},
		});
	}
}
