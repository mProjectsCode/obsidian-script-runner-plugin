import { AbstractCodeMdRenderChild, Language } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext } from 'obsidian';
import { ChildProcess, exec } from 'child_process';
import { isTruthy } from '../utils/Utils';

export class CmdCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process: ChildProcess | undefined;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);
	}

	public getLanguage(): Language {
		return Language.CMD;
	}

	getCommentString(): string {
		return '#';
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();

		const lines = this.data.content.split('\n').filter(x => isTruthy(x));
		if (lines.length !== 2) {
			this.onProcessError('content must be exactly 2 lines long, the id comment on the first line and the command on the second line');
		}

		const command = lines[1];
		this.process = exec(command);

		this.onProcessStart();

		this.process.stdout?.on('data', data => {
			this.onProcessInfo(data.toString());
		});

		this.process.stderr?.on('data', data => {
			this.onProcessError(data.toString());
		});

		this.process.on('exit', code => {
			this.onProcessEnd(code);
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
		return false;
	}

	canConfigureExecutionPath(): boolean {
		return true;
	}

	sendToProcess(data: string): Promise<void> {
		throw Error('Sending data to this process is not supported');
	}
}
