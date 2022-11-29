import { App, PluginSettingTab } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import { CodeMdRenderChildSaveData } from '../markdownRenderChilds/AbstractCodeMdRenderChild';

export interface ScriptRunnerPluginSettings {
	codeMdRenderChildSaveData: CodeMdRenderChildSaveData[];
}

export const DEFAULT_SETTINGS: ScriptRunnerPluginSettings = {
	codeMdRenderChildSaveData: [],
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
