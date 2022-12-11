import { ArgumentType, CommandLineArgument, PathMode, RunConfiguration, ScriptType } from '../RunConfiguration';
import { LogEntry, LogLevel, PseudoConsole } from '../utils/PseudoConsole';
import { LanguageConfiguration } from '../LanguageConfiguration';
import { ChildProcess, spawn } from 'child_process';
import {getActiveFile, getVaultBasePath, isPath} from '../utils/Utils';
import { normalizePath, TFile } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import * as path from 'path';

export const Language = {
	JS: 'js',
	PYTHON: 'python',
	CMD: 'bash',
	OCTAVE: 'matlab',

	UNDEFINED: 'undefined',
} as const;
export type Language = typeof Language[keyof typeof Language];

export const LanguageMap: Record<string, Language> = {
	'js': Language.JS,
	'py': Language.PYTHON,
	'octave': Language.OCTAVE,
};

export abstract class AbstractScriptRunner {
	readonly plugin: ScriptRunnerPlugin;

	readonly languageConfiguration: LanguageConfiguration;
	readonly runConfiguration: RunConfiguration;

	protected onScriptConsoleLogCallback?: (message: LogEntry) => void;
	protected onExecuteScriptCallback?: () => void | Promise<void>;
	protected onTerminateScriptCallback?: (reason: string | Error) => void | Promise<void>;
	protected onSendInputCallback?: (data: string) => void | Promise<void>;
	protected onExecutionErrorCallback?: (error: Error) => void | Promise<void>;

	protected onScriptStartCallback?: () => void | Promise<void>;
	protected onScriptEndCallback?: (code: number | undefined | null) => void | Promise<void>;

	process?: ChildProcess;
	executionFileToCleanUp: TFile | undefined;

	protected constructor(plugin: ScriptRunnerPlugin, languageConfiguration: LanguageConfiguration, runConfiguration: RunConfiguration) {
		this.plugin = plugin;
		this.languageConfiguration = languageConfiguration;
		this.runConfiguration = runConfiguration;
	}

	// region getters

	getDetachedOverride(): boolean {
		// if language doesn't allow overriding
		if (!this.languageConfiguration.permissions.canOverrideDetached) {
			// return the language default
			return this.languageConfiguration.languageDefaults.detached;
		}

		// if the run config shouldn't override
		if (!this.runConfiguration.overrides.overrideDetached) {
			// return the language default
			return this.languageConfiguration.languageDefaults.detached;
		} else {
			// else run config should override
			// if the override is undefined
			if (this.runConfiguration.overrides.detached == null) {
				// throw error
				throw new Error('run configuration should override detached, but detached is undefined in run configuration');
			}

			// return the override
			return this.runConfiguration.overrides.detached;
		}
	}

	getCommandLineArgumentsOverride(): CommandLineArgument[] {
		// if language doesn't allow overriding
		if (!this.languageConfiguration.permissions.canOverrideCommandLineArguments) {
			// return the language default
			return this.languageConfiguration.languageDefaults.commandLineArguments;
		}

		// if the run config shouldn't override, but merge
		if (!this.runConfiguration.overrides.overrideCommandLineArguments) {
			// and if the override is undefined
			if (!this.runConfiguration.overrides.commandLineArguments) {
				// return the language default
				return this.languageConfiguration.languageDefaults.commandLineArguments;
			}

			// else return them merged
			return this.languageConfiguration.languageDefaults.commandLineArguments.concat(this.runConfiguration.overrides.commandLineArguments);
		} else {
			// else run config should override
			// if the override is undefined
			if (this.runConfiguration.overrides.commandLineArguments == null) {
				// throw error
				throw new Error('run configuration should override command line arguments, but command line arguments are undefined in run configuration');
			}

			// return the override
			return this.runConfiguration.overrides.commandLineArguments;
		}
	}

	getArgumentAsStringArray(argument: CommandLineArgument): string[] {
		if (argument.type === ArgumentType.SINGLE_VALUE) {
			if (!argument.value) {
				throw new Error('Argument value may not be empty');
			}
			return [argument.value];
		} else if (argument.type === ArgumentType.KEY_VALUE) {
			if (!argument.value) {
				throw new Error('Argument value may not be empty');
			}
			if (!argument.key) {
				throw new Error('Argument key may not be empty');
			}
			return [argument.key, argument.value];
		} else {
			throw new Error('Undefined argument type');
		}
	}

	getCommandLineArgumentsAsStringArray(): string[] {
		return this.getCommandLineArgumentsOverride()
			.map(x => this.getArgumentAsStringArray(x))
			.flat(1);
	}

	getCommandLineExecutionArgumentAsStringArray(): string[] {
		return this.languageConfiguration.commandLineExecutionArgument ? this.getArgumentAsStringArray(this.languageConfiguration.commandLineExecutionArgument) : [];
	}

	// endregion

	// region process

	protected async executeScript(): Promise<void> {
		const { vaultRelativeFilePath, absoluteFilePath } = this.getExecutionFilePath();

		if (this.runConfiguration.scriptData.scriptType === ScriptType.STRING) {
			if (this.runConfiguration.executionPath?.mode === PathMode.ABSOLUTE) {
				throw new Error(`can not run a ${this.languageConfiguration.language} script from string with path mode absolute`);
			}

			const content = this.runConfiguration.scriptData.scriptContent;
			if (!content) {
				throw new Error(`can not run a ${this.languageConfiguration.language} script from string with empty script content`);
			}

			console.log(`OSR | getting file ${vaultRelativeFilePath} for ${this.runConfiguration.uuid}`);
			this.executionFileToCleanUp = this.plugin.app.vault.getAbstractFileByPath(normalizePath(vaultRelativeFilePath)) as TFile;
			if (this.executionFileToCleanUp) {
				console.log(`OSR | modifying execution file ${vaultRelativeFilePath} for ${this.runConfiguration.uuid}`);
				await this.plugin.app.vault.modify(this.executionFileToCleanUp, content);
			} else {
				console.log(`OSR | creating execution file ${vaultRelativeFilePath} for ${this.runConfiguration.uuid}`);
				this.executionFileToCleanUp = await this.plugin.app.vault.create(vaultRelativeFilePath, content);
			}
		}

		console.log(`osr | running command: ${this.languageConfiguration.userConfigurable.consoleCommand} ${this.getCommandLineArgumentsAsStringArray()} ${this.getCommandLineExecutionArgumentAsStringArray()} ${absoluteFilePath}`);

		this.process = spawn(
			this.languageConfiguration.userConfigurable.consoleCommand,
			[
				...this.getCommandLineArgumentsAsStringArray(),
				...this.getCommandLineExecutionArgumentAsStringArray(),
				absoluteFilePath,
			],
			{
				detached: this.getDetachedOverride(),
				shell: this.getDetachedOverride(),
			}
		);

		this.onScriptStartCallback?.();

		this.process.stdout?.on('data', data => {
			this.scriptConsoleLogInfo(data.toString());
		});

		this.process.stderr?.on('data', data => {
			this.scriptConsoleLogError(data.toString());
		});

		this.process.on('exit', async code => {
			await this.onScriptEndCallback?.(code);

			if (this.executionFileToCleanUp) {
				console.log(`OSR | deleting execution file ${this.executionFileToCleanUp.path} for ${this.runConfiguration.uuid}`);
				await this.plugin.app.vault.delete(this.executionFileToCleanUp);
			}
			this.process = undefined;
		});
	}

	public async tryExecuteScript(): Promise<void> {
		console.log(`OSR | running script of code block ${this.runConfiguration.uuid}`);
		this.clearConsole();

		await this.onExecuteScriptCallback?.();
		await this.executeScript();
	}

	public async saveExecuteScript(): Promise<void> {
		try {
			await this.tryExecuteScript();
		} catch (e) {
			await this.onExecutionErrorCallback?.(e);
		}
	}

	protected async terminateScript(reason: string | Error): Promise<void> {
		if (!this.process) {
			throw new Error('can not terminate a script that is not running');
		}

		this.process?.kill('SIGINT');
		this.process = undefined;
	}

	public async tryTerminateScript(reason: string | Error): Promise<void> {
		if (!this.languageConfiguration.permissions.canTerminateScript) {
			throw new Error(`Can not terminate script ${this.runConfiguration.uuid}, scripts of language ${this.languageConfiguration.language} can not be terminated`);
		}

		await this.onTerminateScriptCallback?.(reason);
		return await this.terminateScript(reason);
	}

	protected async sendInput(data: string): Promise<void> {
		if (!this.process) {
			throw new Error('can not send data to a script that is not running');
		}

		data = `${data}\n`;
		this.process.stdin?.write(data, (error: Error) => {
			if (error) {
				throw error;
			}
		});
	}

	public async trySendInput(data: string): Promise<void> {
		if (!this.languageConfiguration.permissions.canSendInput) {
			throw new Error(`Can not send input to script ${this.runConfiguration.uuid}, scripts of language ${this.languageConfiguration.language} can not receive inputs`);
		}

		await this.onSendInputCallback?.(data);
		return await this.sendInput(data);
	}

	// endregion

	// region execution file

	getExecutionFilePath(): { vaultRelativeFilePath: string; absoluteFilePath: string } {
		let {mode, path: exePath} = this.runConfiguration.executionPath ?? { mode: PathMode.FILE_RELATIVE, path: '' };

		if (this.runConfiguration.scriptData.scriptType === ScriptType.STRING) {
			if (isPath(exePath)) {
				exePath = path.join(exePath, this.getExecutionFileName());
			}
		}

		let vaultRelativeFilePath: string = '';
		let absoluteFilePath: string = '';
		if (mode === PathMode.FILE_RELATIVE) {
			const activeFile = getActiveFile();
			if (!activeFile) {
				throw new Error('can not run script with file relative execution path, no file is open');
			}
			vaultRelativeFilePath = path.join(activeFile.parent.path, exePath);
			absoluteFilePath = path.join(getVaultBasePath(), vaultRelativeFilePath);
		} else if (mode === PathMode.VAULT_RELATIVE) {
			vaultRelativeFilePath = exePath;
			absoluteFilePath = path.join(getVaultBasePath(), vaultRelativeFilePath);
		} else if (mode === PathMode.ABSOLUTE) {
			absoluteFilePath = exePath;
		}

		return { vaultRelativeFilePath, absoluteFilePath };
	}

	getExecutionFileName(): string {
		return `${this.languageConfiguration.language}_${this.runConfiguration.uuid.replaceAll('-', '_')}.${this.languageConfiguration.fileEnding}`;
	}

	// endregion

	// region console

	createPseudoConsole(addNewline: boolean = false): PseudoConsole {
		const pseudoConsole = new PseudoConsole(addNewline);
		pseudoConsole.onTrace(this.scriptConsoleLogTrace.bind(this));
		pseudoConsole.onInfo(this.scriptConsoleLogInfo.bind(this));
		pseudoConsole.onWarn(this.scriptConsoleLogWarn.bind(this));
		pseudoConsole.onError(this.scriptConsoleLogError.bind(this));

		return pseudoConsole;
	}

	clearConsole(): void {
		this.runConfiguration.scriptData.scriptConsole = [];
	}

	scriptConsoleLogTrace(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.scriptConsoleLog({
				level: LogLevel.TRACE,
				message: message,
			});
		} else {
			this.scriptConsoleLog(message);
		}
	}

	scriptConsoleLogInfo(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.scriptConsoleLog({
				level: LogLevel.INFO,
				message: message,
			});
		} else {
			this.scriptConsoleLog(message);
		}
	}

	scriptConsoleLogWarn(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.scriptConsoleLog({
				level: LogLevel.WARN,
				message: message,
			});
		} else {
			this.scriptConsoleLog(message);
		}
	}

	scriptConsoleLogError(message: string | LogEntry): void {
		if (typeof message == 'string') {
			this.scriptConsoleLog({
				level: LogLevel.ERROR,
				message: message,
			});
		} else {
			this.scriptConsoleLog(message);
		}
	}

	scriptConsoleLog(logEntry: LogEntry): void {
		console.debug(`OSR | script ${this.runConfiguration.uuid} logged ${logEntry.level}`, logEntry.message);
		this.onScriptConsoleLogCallback?.(logEntry);
		this.runConfiguration.scriptData.scriptConsole.push(logEntry);
	}

	// endregion

	// region callbacks

	public onScriptConsoleLog(callback: (message: LogEntry) => void): void {
		this.onScriptConsoleLogCallback = callback;
	}

	public onExecuteScript(callback: () => void): void | Promise<void> {
		this.onExecuteScriptCallback = callback;
	}

	public onTerminateScript(callback: (reason: string | Error) => void): void | Promise<void> {
		this.onTerminateScriptCallback = callback;
	}

	public onSendInput(callback: (data: string) => void): void | Promise<void> {
		this.onSendInputCallback = callback;
	}

	public onScriptStart(callback: () => void): void | Promise<void> {
		this.onScriptStartCallback = callback;
	}

	public onScriptEnd(callback: (code: number | undefined | null) => void): void | Promise<void> {
		this.onScriptEndCallback = callback;
	}

	public onExecutionError(callback: (error: Error) => void): void | Promise<void> {
		this.onExecutionErrorCallback = callback;
	}

	// endregion
}
