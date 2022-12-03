import {ArgumentType, CommandLineArgument, Path, PathMode, RunConfiguration} from '../RunConfiguration';
import {LogEntry, LogLevel, PseudoConsole} from '../utils/PseudoConsole';
import {LanguageConfiguration} from '../LanguageConfiguration';
import {ChildProcess, spawn} from 'child_process';
import {getActiveFile, getVaultBasePath, ScriptRunnerInternalError} from '../utils/Utils';
import {normalizePath, TFile} from 'obsidian';
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

export abstract class AbstractScriptRunner {
	readonly plugin: ScriptRunnerPlugin;

	readonly languageConfiguration: LanguageConfiguration;
	readonly runConfiguration: RunConfiguration;

	protected onScriptConsoleLogCallback?: (message: LogEntry) => void;
	protected onExecuteScriptCallback?: () => void;
	protected onTerminateScriptCallback?: (reason: string | Error) => void;
	protected onSendInputCallback?: (data: string) => void;

	protected onScriptStartCallback?: () => void;
	protected onScriptEndCallback?: (code: number | undefined | null) => void;

	process?: ChildProcess;


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
		} else { // else run config should override
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
		} else { // else run config should override
			// if the override is undefined
			if (this.runConfiguration.overrides.commandLineArguments == null) {
				// throw error
				throw new Error('run configuration should override command line arguments, but command line arguments are undefined in run configuration');
			}

			// return the override
			return this.runConfiguration.overrides.commandLineArguments;
		}
	}

	getCommandLineArgumentsAsStringArray(): string[] {
		return this.getCommandLineArgumentsOverride().map(x => {
			if (x.type === ArgumentType.SINGLE_VALUE) {
				if (!x.value) {
					throw new Error('Argument value may not be empty');
				}
				return [x.value];
			} else if (x.type === ArgumentType.KEY_VALUE) {
				if (!x.value) {
					throw new Error('Argument value may not be empty');
				}
				if (!x.key) {
					throw new Error('Argument key may not be empty');
				}
				return [x.key, x.value];
			} else {
				throw new Error('Undefined argument type');
			}
		}).flat(1);
	}

	// endregion

	// region process

	protected async executeScript(): Promise<void> {
		const { vaultRelativeFilePath, absoluteFilePath } = this.getExecutionFilePath();

		this.process = spawn(this.languageConfiguration.userConfigurable.consoleCommand, [absoluteFilePath, ...this.getCommandLineArgumentsAsStringArray()], {
			detached: this.getDetachedOverride(),
			shell: this.getDetachedOverride(),
		});

		this.onScriptStartCallback?.();

		this.process.stdout?.on('data', data => {
			this.scriptConsoleLogInfo(data.toString());
		});

		this.process.stderr?.on('data', data => {
			this.scriptConsoleLogError(data.toString());
		});

		this.process.on('exit', code => {
			this.onScriptEndCallback?.(code);
			this.process = undefined;
		});
	}

	public async tryExecuteScript(): Promise<void> {
		console.log(`OSR | running script of code block ${this.runConfiguration.uuid}`);
		this.clearConsole();

		this.onExecuteScriptCallback?.();
		await this.executeScript();
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

		this.onTerminateScriptCallback?.(reason);
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

		this.onSendInputCallback?.(data);
		return await this.sendInput(data);
	}

	// endregion

	// region execution file

	getExecutionFilePath(): { vaultRelativeFilePath: string; absoluteFilePath: string } {
		const executionPath = this.runConfiguration.executionPath ?? { mode: PathMode.FILE_RELATIVE, path: '' };

		let vaultRelativeFilePath: string = '';
		let absoluteFilePath: string = '';
		if (executionPath.mode === PathMode.FILE_RELATIVE) {
			const activeFile = getActiveFile();
			if (!activeFile) {
				throw new Error('can not run script with file relative execution path, no file is open');
			}
			vaultRelativeFilePath = path.join(activeFile.parent.path, executionPath.path);
			absoluteFilePath = path.join(getVaultBasePath(), vaultRelativeFilePath);
		} else if (executionPath.mode === PathMode.VAULT_RELATIVE) {
			vaultRelativeFilePath = executionPath.path;
			absoluteFilePath = path.join(getVaultBasePath(), vaultRelativeFilePath);
		} else if (executionPath.mode === PathMode.ABSOLUTE) {
			absoluteFilePath = executionPath.path;
		}

		return { vaultRelativeFilePath, absoluteFilePath };
	}

	// TODO: move to code block version
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

	public onExecuteScript(callback: () => void): void {
		this.onExecuteScriptCallback = callback;
	}

	public onTerminateScript(callback: (reason: string | Error) => void): void {
		this.onTerminateScriptCallback = callback;
	}

	public onSendInput(callback: (data: string) => void): void {
		this.onSendInputCallback = callback;
	}

	public onScriptStart(callback: () => void): void {
		this.onScriptStartCallback = callback;
	}

	public onScriptEnd(callback: (code: number | undefined | null) => void): void {
		this.onScriptEndCallback = callback;
	}

	// endregion
}
