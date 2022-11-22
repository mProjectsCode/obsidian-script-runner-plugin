import {AbstractCodeMdRenderChild, Language, LogEntry, LogLevel, PseudoConsole} from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import {MarkdownPostProcessorContext} from 'obsidian';
import {ChildProcess, spawn} from 'child_process';
import {getActiveFile, getVaultBasePath} from '../utils/Utils';
import * as path from 'path';

export class PyCodeMdRenderChild extends AbstractCodeMdRenderChild {
	process?: ChildProcess;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.PYTHON);
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
		})

		const filePath: string = path.join(getActiveFile().parent.path, `${this.data.id}.py`);
		const absoluteFilePath: string = path.join(getVaultBasePath(), filePath);

		console.log('creating file', filePath);
		const tFile = await this.plugin.app.vault.create(filePath, this.data.content);

		this.process = spawn('py', ['-u', absoluteFilePath], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		this.data.running = true;
		this.component.update();

		this.process.stdout?.on('data', (data) => {
			data = data.toString();
			console.log('data', data);
			pseudoConsole.log(data);
		});

		this.process.stderr?.on('data', (data) => {
			data = data.toString();
			console.log('err', data);
			pseudoConsole.error(data);
		});

		this.process.on('exit', (code) => {
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
		return true;
	}

	public async killProcess(reason?: Error|string): Promise<boolean> {
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
		return true;
	}

	public async sendToProcess(data: string): Promise<void> {
		if (!this.process) {
			throw new Error('Can not send data to process, no process running');
		}

		data = `${data}\n`
		this.process.stdin?.write(data, (error) => console.log(error));
		this.data.console.push({level: LogLevel.TRACE, message: data})
	}
}
