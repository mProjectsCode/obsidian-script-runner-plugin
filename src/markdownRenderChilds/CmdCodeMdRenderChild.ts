import {AbstractCodeMdRenderChild, Language, PseudoConsole} from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import {MarkdownPostProcessorContext} from 'obsidian';
import {ChildProcess, exec} from 'child_process';
import {isTruthy} from '../utils/Utils';

export class CmdCodeMdRenderChild extends AbstractCodeMdRenderChild {
	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.CMD);
		this.parseId();
	}

	getCommentString(): string {
		return '#';
	}

	public async run(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.data.console = [];
		const pseudoConsole = new PseudoConsole();

		const lines = this.data.content.split('\n').filter(x => isTruthy(x));
		if (lines.length !== 2) {
			pseudoConsole.error('content must be exactly 2 lines long, the id comment on the first line and the command on the second line');
			this.data.console = pseudoConsole.out;
			this.component.updateConsole();
		}

		const command = lines[1];
		const process: ChildProcess = exec(command);

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
		});
	}
}
