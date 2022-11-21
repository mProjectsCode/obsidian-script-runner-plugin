import {AbstractCodeMdRenderChild, Language, LogLevel, PseudoConsole} from './AbstractCodeMdRenderChild';
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

	public async run(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);
		try {
			this.data.console = [];

			let content = this.data.content;
			if (content.contains('await')) {
				content = '(async () => { ' + content + ' })()';
			}
			let func = new Function('console', content);

			let pseudoConsole = new PseudoConsole();
			await Promise.resolve(func(pseudoConsole));

			this.data.console = pseudoConsole.out.map(x => {
				x.message = `${x.message}\n`;
				return x;
			});
			console.log(`OSR | script result of code block ${this.data.id}\n`, pseudoConsole.out);
		} catch (e) {
			console.warn(`OSR | error running script of code block ${this.data.id}`);
			this.data.console = [{level: LogLevel.ERROR, message: e.message}];
		}
	}
}
