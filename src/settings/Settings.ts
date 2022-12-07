import { App, PluginSettingTab } from 'obsidian';
import ScriptRunnerPlugin from '../main';
import { CodeMdRenderChildSaveData } from '../markdownRenderChilds/AbstractCodeMdRenderChild';
import { RunConfiguration } from '../RunConfiguration';

export interface ScriptRunnerPluginSettings {
	codeMdRenderChildSaveData: CodeMdRenderChildSaveData[];
	runConfigs: RunConfiguration[];
}

export const DEFAULT_SETTINGS: ScriptRunnerPluginSettings = {
	codeMdRenderChildSaveData: [],
	runConfigs: [],
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
