import { AbstractCodeMdRenderChild, Language } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext, TFile } from 'obsidian';
import { ChildProcess, spawn } from 'child_process';
import { getActiveFile, getVaultBasePath } from '../utils/Utils';
import * as path from 'path';

export class PyCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process?: ChildProcess;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);
	}

	public getLanguage(): Language {
		return Language.PYTHON;
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();

		const { tFile, vaultRelativeFilePath, absoluteFilePath } = await this.createExecutionFile(this.data.content);

		this.process = spawn('py', ['-u', absoluteFilePath], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		this.onProcessStart();

		this.process.stdout?.on('data', data => {
			this.onProcessInfo(data.toString());
		});

		this.process.stderr?.on('data', data => {
			this.onProcessError(data.toString());
		});

		this.process.on('exit', code => {
			this.onProcessEnd(code);
			this.deleteExecutionFile(tFile);
			this.process = undefined;
		});
	}

	public canKillProcess(): boolean {
		return true;
	}

	async killProcess(reason: Error | string): Promise<boolean> {
		if (!this.process) {
			this.onProcessError(`Can not terminate process, no process running.`);
			return false;
		}

		if (reason) {
			if (reason instanceof Error) {
				this.onProcessError(`Process was terminated because of error:\n${reason.message}`);
			} else {
				this.onProcessError(`Process was terminated because of:\n${reason}`);
			}
		}

		this.process?.kill('SIGINT');
		this.process = undefined;
		return true;
	}

	public canSendToProcess(): boolean {
		return true;
	}

	public async sendToProcess(data: string): Promise<void> {
		if (!this.process) {
			throw new Error('Can not send data to process, no process running');
		}

		data = `${data}\n`;
		this.process.stdin?.write(data, (error: Error) => {
			if (error) {
				this.onProcessError(error.message);
			}
		});
		this.onProcessTrace(data);
	}

	public canConfigureExecutionPath(): boolean {
		return true;
	}
}
