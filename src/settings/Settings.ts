import { App, PluginSettingTab } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import { CodeMdRenderChildData } from '../markdownRenderChilds/AbstractCodeMdRenderChild';

export interface ScriptRunnerPluginSettings {
	codeMdRenderChildData: CodeMdRenderChildData[];
}

export const DEFAULT_SETTINGS: ScriptRunnerPluginSettings = {
	codeMdRenderChildData: [],
};

export class ScriptRunnerSettingTab extends PluginSettingTab {
	plugin: ScriptRunnerPlugin;

	constructor(app: App, plugin: ScriptRunnerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
