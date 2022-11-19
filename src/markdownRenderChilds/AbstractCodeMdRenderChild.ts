import {MarkdownRenderChild} from 'obsidian';
import ScriptRunnerPlugin from '../main';
import CodeMdRenderChildComponent from './CodeMdRenderChildComponent.svelte';

export interface CodeMdRenderChildData {
	id: string;
	content: string;
	result: string;
	language: Language;
}

export enum Language {
	JS = 'js',
}

export abstract class AbstractCodeMdRenderChild extends MarkdownRenderChild {
	plugin: ScriptRunnerPlugin;
	data: CodeMdRenderChildData;
	file: string;


	protected constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin) {
		super(containerEl);
		this.plugin = plugin;
	}

	abstract run(): Promise<void>;

	public onload(): void {
		new CodeMdRenderChildComponent({
			target: this.containerEl,
			props: {
				data: this.data,
				run: this.run.bind(this),
			},
		});
	}
}
