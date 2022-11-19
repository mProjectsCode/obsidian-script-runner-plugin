import {AbstractCodeMdRenderChild, Language} from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import {MarkdownPostProcessorContext} from 'obsidian';
import {getUUID} from '../utils/Utils';

class PseudoConsole {
	out: string;

	constructor() {
		this.out = '';
	}

	log(...obj: any[]) {
		this.out += `LOG   | ${obj.map(x => {
			if (typeof x === 'string') {
				return x;
			} else {
				return JSON.stringify(x, null, 4);
			}
		}).join(' ')}\n`;
	}

	warn(...obj: any[]) {
		this.out += `WARN  | ${obj.map(x => {
			if (typeof x === 'string') {
				return x;
			} else {
				return JSON.stringify(x, null, 4);
			}
		}).join(' ')}\n`;
	}

	error(...obj: any[]) {
		this.out += `ERROR | ${obj.map(x => {
			if (typeof x === 'string') {
				return x;
			} else {
				return JSON.stringify(x, null, 4);
			}
		}).join(' ')}\n`;
	}
}

export class JsCodeMdRenderChild extends AbstractCodeMdRenderChild {
	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin);

		this.data = {
			id: getUUID(),
			content: fullDeclaration,
			result: '',
			language: Language.JS,
		}
	}

	public async run(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);
		try {
			let content = this.data.content;
			if (content.contains('await')) {
				content = '(async () => { ' + content + ' })()';
			}
			let func = new Function('console', content);

			let pseudoConsole = new PseudoConsole();
			await Promise.resolve(func(pseudoConsole));

			this.data.result = pseudoConsole.out;
			console.log(`OSR | script result of code block ${this.data.id}\n`, pseudoConsole.out);
		} catch (e) {
			console.warn(`OSR | error running script of code block ${this.data.id}`);
			this.data.result = e.message;
		}
	}
}
