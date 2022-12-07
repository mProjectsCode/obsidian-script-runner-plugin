import { AbstractScriptRunner } from './AbstractScriptRunner';
import { RunConfiguration } from '../RunConfiguration';
import ScriptRunnerPlugin from '../main';
import { DEFAULT_OCTAVE_LANG_CONFIG } from '../LanguageConfiguration';

export class OctaveScriptRunner extends AbstractScriptRunner {
	constructor(plugin: ScriptRunnerPlugin, runConfiguration: RunConfiguration) {
		super(plugin, DEFAULT_OCTAVE_LANG_CONFIG, runConfiguration);
	}
}
