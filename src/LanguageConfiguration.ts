import { Language } from './scriptRunners/AbstractScriptRunner';
import { ArgumentType, CommandLineArgument } from './RunConfiguration';

export const DEFAULT_PYTHON_LANG_CONFIG: LanguageConfiguration = {
	language: Language.PYTHON,
	commentString: '#',
	fileEnding: 'py',
	userConfigurable: {
		consoleCommand: 'py',
	},
	languageDefaults: {
		detached: false,
		commandLineArguments: [
			{
				type: ArgumentType.SINGLE_VALUE,
				key: undefined,
				value: '-u',
			},
		],
	},
	permissions: {
		canTerminateScript: true,
		canSendInput: true,
		canSpecifyExecutionPath: true,

		canOverrideCommandLineArguments: true,
		canOverrideDetached: true,
	},
};

export const DEFAULT_OCTAVE_LANG_CONFIG: LanguageConfiguration = {
	language: Language.OCTAVE,
	commentString: '%',
	fileEnding: 'm',
	userConfigurable: {
		consoleCommand: 'octave',
	},
	languageDefaults: {
		detached: true,
		commandLineArguments: [
			{
				type: ArgumentType.SINGLE_VALUE,
				key: undefined,
				value: '--persist',
			},
		],
	},
	permissions: {
		canTerminateScript: false,
		canSendInput: false,
		canSpecifyExecutionPath: true,

		canOverrideCommandLineArguments: true,
		canOverrideDetached: false,
	},
};

export const DEFAULT_JS_LANG_CONFIG: LanguageConfiguration = {
	language: Language.JS,
	commentString: '//',
	fileEnding: 'js',
	userConfigurable: {
		consoleCommand: '',
	},
	languageDefaults: {
		detached: false,
		commandLineArguments: [
			{
				type: ArgumentType.SINGLE_VALUE,
				key: undefined,
				value: '-u',
			},
		],
	},
	permissions: {
		canTerminateScript: false,
		canSendInput: false,
		canSpecifyExecutionPath: false,

		canOverrideCommandLineArguments: false,
		canOverrideDetached: false,
	},
};

export function getDefaultLanguageCofigForLanguage(lang: Language): LanguageConfiguration | undefined {
	const map: Record<Language, LanguageConfiguration | undefined> = {
		[Language.PYTHON]: DEFAULT_PYTHON_LANG_CONFIG,
		[Language.OCTAVE]: DEFAULT_OCTAVE_LANG_CONFIG,
		[Language.JS]: DEFAULT_JS_LANG_CONFIG,
		[Language.CMD]: undefined,
		[Language.UNDEFINED]: undefined,
	};

	return map[lang];
}

export interface LanguageConfiguration {
	language: Language;
	commentString: string;
	fileEnding: string;
	userConfigurable: {
		consoleCommand: string;
	};
	languageDefaults: {
		detached: boolean;
		commandLineArguments: CommandLineArgument[];
	};
	permissions: {
		canTerminateScript: boolean;
		canSendInput: boolean;
		canSpecifyExecutionPath: boolean;

		canOverrideDetached: boolean;
		canOverrideCommandLineArguments: boolean;
	};
}
