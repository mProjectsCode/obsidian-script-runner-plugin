import { AbstractCodeMdRenderChild, Language, LogEntry, LogLevel, PseudoConsole } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext } from 'obsidian';
import {ChildProcess, exec, spawn} from 'child_process';
import { getActiveFile, getVaultBasePath } from '../utils/Utils';
import * as path from 'path';

export class OctaveCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process?: ChildProcess;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.OCTAVE);
		this.parseId();
	}

	getCommentString(): string {
		return '%';
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();
		const pseudoConsole = new PseudoConsole();
		pseudoConsole.onLog((logEntry: LogEntry) => {
			this.data.console.push(logEntry);
			this.component.updateConsole();
		});

		const fileName: string = `o${this.data.id?.replaceAll('-', '_')}`;
		const filePath: string = path.join(getActiveFile().parent.path, `${fileName}.m`);
		const absoluteFilePath: string = path.join(getVaultBasePath(), filePath);

		console.log('creating file', filePath);
		const tFile = await this.plugin.app.vault.create(filePath, this.data.content);

		this.process = spawn('octave', ['--persist', absoluteFilePath], {
			shell: true,
			detached: true,
		});

		this.data.running = true;
		this.component.update();

		this.process.stdout?.on('data', data => {
			data = data.toString();
			console.log('data', data);
			pseudoConsole.log(data);
		});

		this.process.stderr?.on('data', data => {
			data = data.toString();
			console.log('err', data);
			pseudoConsole.error(data);
		});

		this.process.on('exit', code => {
			console.log('exit', code);
			pseudoConsole.log(`\nprocess exited with code ${code}`);

			this.data.running = false;
			this.component.update();

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
