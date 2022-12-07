import { AbstractScriptRunner } from './AbstractScriptRunner';
import { RunConfiguration, ScriptType } from '../RunConfiguration';
import ScriptRunnerPlugin from '../main';
import { DEFAULT_JS_LANG_CONFIG } from '../LanguageConfiguration';
import { getAPI } from 'obsidian-dataview';
import { getActiveFile } from '../utils/Utils';

export class JsScriptRunner extends AbstractScriptRunner {
	constructor(plugin: ScriptRunnerPlugin, runConfiguration: RunConfiguration) {
		super(plugin, DEFAULT_JS_LANG_CONFIG, runConfiguration);
	}

	protected async executeScript(): Promise<void> {
		const pseudoConsole = this.createPseudoConsole(true);

		if (this.runConfiguration.scriptData.scriptType === ScriptType.FILE) {
			throw new Error(`can not run a ${this.languageConfiguration.language} script from file`);
		}

		const content = this.runConfiguration.scriptData.scriptContent;

		if (!content) {
			throw new Error(`script content can not be empty for language ${this.languageConfiguration.language}`);
		}

		const isAsync = content.contains('await');
		const funcConstructor = isAsync ? async function (): Promise<void> {}.constructor : Function;
		const func: any = funcConstructor('console', 'app', 'dv', 'file', content);

		this.onScriptStartCallback?.();

		await Promise.resolve(func(pseudoConsole, this.plugin.app, getAPI(this.plugin.app), getActiveFile()));

		this.onScriptEndCallback?.(undefined);
	}
}
