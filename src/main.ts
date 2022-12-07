import {Editor, loadPrism, MarkdownView, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, ScriptRunnerPluginSettings, ScriptRunnerSettingTab} from './settings/Settings';
import {getUUID} from './utils/Utils';
import {filterHighlightAllPlugin} from './utils/prismPlugins';
import {PathMode, RunConfiguration, ScriptType} from './RunConfiguration';
import {Language} from './scriptRunners/AbstractScriptRunner';
import {CodeMdRenderChild} from './markdownRenderChilds/CodeMdRenderChild';

// Remember to rename these classes and interfaces!

export default class ScriptRunnerPlugin extends Plugin {
	settings: ScriptRunnerPluginSettings;

	async onload(): Promise<void> {
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

		const runners = ['js-runner', 'py-runner', 'octave-runner'];

		for (const runner of runners) {
			this.registerMarkdownCodeBlockProcessor(runner, (source, el, ctx) => {
				ctx.addChild(new CodeMdRenderChild(el, this, runner, source));
			});
		}

		// this.registerMarkdownCodeBlockProcessor('js-runner', (source, el, ctx) => {
		// 	ctx.addChild(new JsCodeMdRenderChild(el, this, source, ctx));
		// });
		//
		// this.registerMarkdownCodeBlockProcessor('py-runner', (source, el, ctx) => {
		// 	ctx.addChild(new PyCodeMdRenderChild(el, this, source, ctx));
		// });
		//
		// this.registerMarkdownCodeBlockProcessor('cmd-runner', (source, el, ctx) => {
		// 	ctx.addChild(new CmdCodeMdRenderChild(el, this, source, ctx));
		// });
		//
		// this.registerMarkdownCodeBlockProcessor('octave-runner', (source, el, ctx) => {
		// 	ctx.addChild(new OctaveCodeMdRenderChild(el, this, source, ctx));
		// });

		// this.registerCodeMirror((cm: CodeMirror.Editor) => {
		//
		// })
		//
		// this.registerEditorExtension(this.lang());

		const prism = await loadPrism();
		filterHighlightAllPlugin(prism);
		prism.plugins.filterHighlightAll.reject.addSelector('code.no-highlight');

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

	onunload(): void {}

	loadRunConfig(uuid: string, defaultConfig?: RunConfiguration): RunConfiguration {
		const runConfig = this.settings.runConfigs.find(x => x.uuid === uuid) ?? defaultConfig ?? this.getDefaultRunConfig();
		console.log(`OSR | loaded data for ${uuid}`, runConfig);
		return runConfig;
	}

	async saveRunConfig(runConfig: RunConfiguration): Promise<void> {
		console.log(`OSR | saved data for ${runConfig.uuid}`, runConfig.uuid);
		this.settings.runConfigs = this.settings.runConfigs.filter(x => x.uuid !== runConfig.uuid);
		this.settings.runConfigs.push(runConfig);
		await this.saveSettings();
	}

	getDefaultRunConfig(): RunConfiguration {
		return {
			uuid: getUUID(),
			executionPath: {
				mode: PathMode.VAULT_RELATIVE,
				path: '',
			},
			scriptData: {
				scriptContent: undefined,
				scriptType: ScriptType.FILE,
				scriptConsole: [],
			},
			scriptArguments: [],
			overrides: {
				overrideDetached: false,
				detached: undefined,
				overrideCommandLineArguments: false,
				commandLineArguments: undefined,
			},
			language: Language.UNDEFINED,
		};
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
