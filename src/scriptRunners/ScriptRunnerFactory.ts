import { AbstractScriptRunner, Language } from './AbstractScriptRunner';
import { JsScriptRunner } from './JsScriptRunner';
import ScriptRunnerPlugin from '../main';
import { RunConfiguration } from '../RunConfiguration';
import {PythonScriptRunner} from './PythonScriptRunner';
import {OctaveScriptRunner} from './OctaveScriptRunner';

export class ScriptRunnerFactory {
	static createScriptRunner(lang: Language, plugin: ScriptRunnerPlugin, runConfig: RunConfiguration): AbstractScriptRunner {
		if (lang === Language.JS) {
			return new JsScriptRunner(plugin, runConfig);
		} else if (lang === Language.PYTHON) {
			return new PythonScriptRunner(plugin, runConfig);
		} else if (lang === Language.OCTAVE) {
			return new OctaveScriptRunner(plugin, runConfig);
		}

		throw new Error(`no script runner for language ${lang}`);
	}
}
