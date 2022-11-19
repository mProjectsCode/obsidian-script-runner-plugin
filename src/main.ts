import {App, Editor, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, ScriptRunnerPluginSettings, ScriptRunnerSettingTab} from './settings/Settings';
import {AbstractCodeMdRenderChild} from './markdownRenderChilds/AbstractCodeMdRenderChild';
import {JsCodeMdRenderChild} from './markdownRenderChilds/JsCodeMdRenderChild';
import {initUUIDGen} from './utils/Utils';

// Remember to rename these classes and interfaces!

export default class ScriptRunnerPlugin extends Plugin {
	settings: ScriptRunnerPluginSettings;

	async onload() {
		initUUIDGen();

		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		this.registerMarkdownCodeBlockProcessor('js-runner', (source, el, ctx) => {
			ctx.addChild(new JsCodeMdRenderChild(
				el,
				this,
				source,
				ctx
			));
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ScriptRunnerSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

