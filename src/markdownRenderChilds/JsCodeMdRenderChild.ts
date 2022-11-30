import { AbstractCodeMdRenderChild, Language } from './AbstractCodeMdRenderChild';
import ScriptRunnerPlugin from '../main';
import { MarkdownPostProcessorContext, TFile } from 'obsidian';
import { DataviewApi, getAPI } from 'obsidian-dataview';

export class JsCodeMdRenderChild extends AbstractCodeMdRenderChild {
	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, fullDeclaration: string, ctx: MarkdownPostProcessorContext) {
		super(containerEl, plugin, fullDeclaration);
	}

	getCommentString(): string {
		return '//';
	}

	public getLanguage(): Language {
		return Language.JS;
	}

	public async runProcess(): Promise<void> {
		console.log(`OSR | running script of code block ${this.data.id}`);
		try {
			this.clearConsole();
			const pseudoConsole = this.createPseudoConsole(true);

			this.onProcessStart();

			const content = this.data.content;
			const isAsync = content.contains('await');
			const funcConstructor = isAsync ? async function (): Promise<void> {}.constructor : Function;

			const func: any = funcConstructor('console', 'app', 'dv', 'file', content);

			const dv: DataviewApi | undefined = getAPI(this.plugin.app);
			const tFile: TFile = this.plugin.app.vault.getAbstractFileByPath(this.file) as TFile;
			await Promise.resolve(func(pseudoConsole, this.plugin.app, dv, tFile));

			this.onProcessEnd(undefined);
		} catch (e) {
			this.onProcessError(e instanceof Error ? e.message : e);
		}
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
		return false;
	}
}
