import { AbstractCodeMdRenderChild } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext } from 'obsidian';
import { ChildProcess, spawn } from 'child_process';
import { Language } from '../scriptRunners/AbstractScriptRunner';

export class OctaveCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process?: ChildProcess;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);
	}

	public getLanguage(): Language {
		return Language.OCTAVE;
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();

		const { tFile, vaultRelativeFilePath, absoluteFilePath } = await this.createExecutionFile(this.data.content);

		this.process = spawn('octave', ['--persist', absoluteFilePath], {
			shell: true,
			detached: true,
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
		return false;
	}

	public async killProcess(reason?: Error | string): Promise<boolean> {
		throw Error('Killing this process is not supported');
	}

	public canSendToProcess(): boolean {
		return false;
	}

	public async sendToProcess(data: string): Promise<void> {
		throw Error('Sending data to this process is not supported');
	}

	public canConfigureExecutionPath(): boolean {
		return true;
	}
}
