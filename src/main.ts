import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, ScriptRunnerPluginSettings, ScriptRunnerSettingTab } from './settings/Settings';
import { JsCodeMdRenderChild } from './markdownRenderChilds/JsCodeMdRenderChild';
import { getUUID } from './utils/Utils';
import { PyCodeMdRenderChild } from './markdownRenderChilds/PyCodeMdRenderChild';
import { CmdCodeMdRenderChild } from './markdownRenderChilds/CmdCodeMdRenderChild';
import { OctaveCodeMdRenderChild } from './markdownRenderChilds/OctaveCodeMdRenderChild';

// Remember to rename these classes and interfaces!

export default class ScriptRunnerPlugin extends Plugin {
	settings: ScriptRunnerPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'osr-gen-uuid',
			name: 'Generate UUID',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// Make sure the user is editing a Markdown file.
				editor.replaceRange(getUUID(), editor.getCursor());

				console.log(view.file.path);
			},
		});

		this.registerMarkdownCodeBlockProcessor('js-runner', (source, el, ctx) => {
			ctx.addChild(new JsCodeMdRenderChild(el, this, source, ctx));
		});

		this.registerMarkdownCodeBlockProcessor('py-runner', (source, el, ctx) => {
			ctx.addChild(new PyCodeMdRenderChild(el, this, source, ctx));
		});

		this.registerMarkdownCodeBlockProcessor('cmd-runner', (source, el, ctx) => {
			ctx.addChild(new CmdCodeMdRenderChild(el, this, source, ctx));
		});

		this.registerMarkdownCodeBlockProcessor('octave-runner', (source, el, ctx) => {
			ctx.addChild(new OctaveCodeMdRenderChild(el, this, source, ctx));
		});

		// this.registerCodeMirror((cm: CodeMirror.Editor) => {
		//
		// })
		//
		// this.registerEditorExtension(this.lang());

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ScriptRunnerSettingTab(this.app, this));
	}

	// lang(): LanguageSupport {
	// 	const langDesc = LanguageDescription.of({
	// 		name: "js-runner",
	// 		alias: ["js-runner"],
	// 		async load() {
	// 			return import("@codemirror/lang-javascript").then(m => m.javascript())
	// 		}
	// 	});
	// }

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
