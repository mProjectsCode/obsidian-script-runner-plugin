import {AbstractCodeMdRenderChild, Language, LogEntry, LogLevel, PseudoConsole} from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import {MarkdownPostProcessorContext} from 'obsidian';

export class JsCodeMdRenderChild extends AbstractCodeMdRenderChild {

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);

		this.setLanguage(Language.JS);
		this.parseId();
	}

	getCommentString(): string {
		return '//';
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);
		try {
			this.clearConsole();
			let pseudoConsole = new PseudoConsole();
			pseudoConsole.onLog((logEntry: LogEntry) => {
				logEntry.message += '\n';
				this.data.console.push(logEntry);
				this.component.updateConsole();
			});

			this.data.running = true;
			this.component.update();

			let content = this.data.content;
			if (content.contains('await')) {
				const AsyncFunction = (async function () {}).constructor;
				let func = AsyncFunction('console', content);
				await Promise.resolve(func(pseudoConsole));
			} else {
				let func = Function('console', content);
				func(pseudoConsole)
			}

			this.data.running = false;
			this.component.update();

			console.log(`OSR | script result of code block ${this.data.id}\n`, pseudoConsole.out);
		} catch (e) {
			console.warn(`OSR | error running script of code block ${this.data.id}`);
			this.data.console.push({ level: LogLevel.ERROR, message: e.message });
		}
	}

	public canKillProcess(): boolean {
		return false;
	}

	public async killProcess(reason?: Error|string): Promise<boolean> {
		throw Error('Killing this process is not supported');
	}

	public canSendToProcess(): boolean {
		return false;
	}

	sendToProcess(data: string): Promise<void> {
		throw Error('Sending data to this process is not supported');
	}
}
