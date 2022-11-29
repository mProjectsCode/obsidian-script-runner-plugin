import { AbstractCodeMdRenderChild, Language } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext } from 'obsidian';
import { ChildProcess, spawn } from 'child_process';
import { getActiveFile, getVaultBasePath } from '../utils/Utils';
import * as path from 'path';

export class OctaveCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process?: ChildProcess;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration, Language.OCTAVE);
	}

	getCommentString(): string {
		return '%';
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();

		const fileName: string = `o${this.data.id?.replaceAll('-', '_')}`;
		const filePath: string = path.join(getActiveFile().parent.path, `${fileName}.m`);
		const absoluteFilePath: string = path.join(getVaultBasePath(), filePath);

		console.log('creating file', filePath);
		const tFile = await this.plugin.app.vault.create(filePath, this.data.content);

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
			console.log('deleting file', filePath);
			this.plugin.app.vault.delete(tFile);
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
}
