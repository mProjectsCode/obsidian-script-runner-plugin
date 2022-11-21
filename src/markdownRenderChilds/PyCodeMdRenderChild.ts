import {AbstractCodeMdRenderChild, Language, PseudoConsole} from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import {MarkdownPostProcessorContext} from 'obsidian';
import {ChildProcess, spawn} from 'child_process';
import {getActiveFile, getVaultBasePath} from '../utils/Utils';
import * as path from 'path';

export class PyCodeMdRenderChild extends AbstractCodeMdRenderChild {
	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.PYTHON);
		this.parseId();
	}

	getCommentString(): string {
		return '#';
	}

	public async run(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.data.console = [];
		const pseudoConsole = new PseudoConsole();

		const filePath: string = path.join(getActiveFile().parent.path, `${this.data.id}.py`);
		const absoluteFilePath: string = path.join(getVaultBasePath(), filePath);

		console.log('creating file', filePath);
		const tFile = await this.plugin.app.vault.create(filePath, this.data.content);

		const command = `py -u "${absoluteFilePath}"`;
		console.log(command);
		const process: ChildProcess = spawn('py', ['-u', absoluteFilePath], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		this.data.running = true;
		this.component.update();

		process.stdout?.on('data', (data) => {
			data = data.toString();
			console.log('data', data);
			pseudoConsole.log(data);
			this.data.console = pseudoConsole.out;
			this.component.updateConsole();
		});

		process.stderr?.on('data', (data) => {
			data = data.toString();
			console.log('err', data);
			pseudoConsole.error(data);
			this.data.console = pseudoConsole.out;
			this.component.updateConsole();
		});

		process.on('exit', (code) => {
			console.log('exit', code);
			pseudoConsole.log(`\nprocess exited with code ${code}`);
			this.data.console = pseudoConsole.out;
			this.component.updateConsole();

			this.data.running = false;
			this.component.update();

			console.log('deleting file', filePath);
			this.plugin.app.vault.delete(tFile);
		});
	}
}
