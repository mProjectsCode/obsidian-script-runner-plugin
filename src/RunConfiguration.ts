import { LogEntry } from './utils/PseudoConsole';
import { Language } from './scriptRunners/AbstractScriptRunner';

export interface RunConfiguration {
	language: Language;
	uuid: string;
	scriptData: ScriptData;
	executionPath: Path | undefined;
	scriptArguments: ScriptArgument[];
	overrides: {
		overrideDetached: boolean;
		detached: boolean | undefined;
		overrideCommandLineArguments: boolean;
		commandLineArguments: CommandLineArgument[] | undefined;
	};
}

export interface ScriptData {
	scriptType: string;
	scriptContent?: string;
	scriptConsole: LogEntry[];
}

export const ScriptType = {
	STRING: 'string',
	FILE: 'file',
} as const;
export type ScriptType = typeof ScriptType[keyof typeof ScriptType];

export interface Path {
	mode: PathMode;
	path: string;
}

export const PathMode = {
	FILE_RELATIVE: 'file_relative',
	VAULT_RELATIVE: 'vault_relative',
	ABSOLUTE: 'absolute',
} as const;
export type PathMode = typeof PathMode[keyof typeof PathMode];

export type ScriptArgument = Argument;
export type CommandLineArgument = Argument;

export interface Argument {
	type: ArgumentType;
	key: string | undefined;
	value: string;
}

export const ArgumentType = {
	SINGLE_VALUE: 'singe_value',
	KEY_VALUE: 'key_value',
} as const;
export type ArgumentType = typeof ArgumentType[keyof typeof ArgumentType];
