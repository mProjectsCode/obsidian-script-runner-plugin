import { AbstractCodeMdRenderChild, Language, LogEntry, LogLevel, PseudoConsole } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext } from 'obsidian';
import { ChildProcess, exec } from 'child_process';
import { isTruthy } from '../utils/Utils';

export class CmdCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process: ChildProcess | undefined;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.CMD);
		this.parseId();
	}

	getCommentString(): string {
		return '#';
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);

		this.clearConsole();
		const pseudoConsole = new PseudoConsole();
		pseudoConsole.onLog((logEntry: LogEntry) => {
			this.data.console.push(logEntry);
			this.component.updateConsole();
		});

		const lines = this.data.content.split('\n').filter(x => isTruthy(x));
		if (lines.length !== 2) {
			pseudoConsole.error('content must be exactly 2 lines long, the id comment on the first line and the command on the second line');
			this.data.console = pseudoConsole.out;
			this.component.updateConsole();
		}

		const command = lines[1];
		this.process = exec(command);

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

			this.process = undefined;
		});
	}

	public canKillProcess(): boolean {
		return true;
	}

	async killProcess(reason: Error | string): Promise<boolean> {
		if (!this.process) {
			this.data.console.push({
				level: LogLevel.ERROR,
				message: `Can not terminate process, no process running.`,
			});
			return false;
		}

		if (reason) {
			if (reason instanceof Error) {
				this.data.console.push({
					level: LogLevel.ERROR,
					message: `Process was terminated because of error:\n${reason.message}`,
				});
			} else {
				this.data.console.push({
					level: LogLevel.ERROR,
					message: `Process was terminated because of:\n${reason}`,
				});
			}
		}

		this.process?.kill('SIGINT');
		this.process = undefined;
		return true;
	}

	public canSendToProcess(): boolean {
		return false;
	}

	sendToProcess(data: string): Promise<void> {
		throw Error('Sending data to this process is not supported');
	}
}
