import { AbstractScriptRunner } from './AbstractScriptRunner';
import { RunConfiguration } from '../RunConfiguration';
import ScriptRunnerPlugin from '../main';
import { DEFAULT_PYTHON_LANG_CONFIG } from '../LanguageConfiguration';

export class PythonScriptRunner extends AbstractScriptRunner {
	constructor(plugin: ScriptRunnerPlugin, runConfiguration: RunConfiguration) {
		super(plugin, DEFAULT_PYTHON_LANG_CONFIG, runConfiguration);
	}
}
