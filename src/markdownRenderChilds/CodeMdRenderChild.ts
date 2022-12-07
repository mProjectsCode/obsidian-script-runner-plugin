import { MarkdownRenderChild } from 'obsidian';
import { PathMode, RunConfiguration, ScriptType } from '../RunConfiguration';
import ScriptRunnerPlugin from '../main';
import { getDefaultLanguageCofigForLanguage, LanguageConfiguration } from '../LanguageConfiguration';
import { getPlaceholderUUID } from '../utils/Utils';
import {AbstractScriptRunner, Language, LanguageMap} from '../scriptRunners/AbstractScriptRunner';
import CodeRunnerMdRenderChild from './CodeRunnerMdRenderChild.svelte';
import { ScriptRunnerFactory } from '../scriptRunners/ScriptRunnerFactory';

export interface CodeMdRenderChildState {
	uuid: string;
	uuidParseError: string | undefined;
	codeBlockContent: string;
	scriptState: ScriptState;
	runConfig?: RunConfiguration;
	languageConfig: LanguageConfiguration;
}

export interface ScriptState {
	isRunning: boolean;
	hasRun: boolean;
}

const idFieldName: string = 'script-id';

export class CodeMdRenderChild extends MarkdownRenderChild {
	plugin: ScriptRunnerPlugin;
	state: CodeMdRenderChildState;
	codeBlockLanguage: string;
	component: CodeRunnerMdRenderChild;
	scriptRunner?: AbstractScriptRunner;

	constructor(containerEl: HTMLElement, plugin: ScriptRunnerPlugin, codeBlockLanguage: string, content: string) {
		super(containerEl);
		this.plugin = plugin;
		this.codeBlockLanguage = codeBlockLanguage;

		const lang: Language = this.parseLanguage();
		const langConfig = getDefaultLanguageCofigForLanguage(lang);
		if (!langConfig) {
			throw new Error(`no default lang config defined for lang ${lang}`);
		}

		this.state = {
			uuid: '',
			uuidParseError: undefined,
			codeBlockContent: content,
			scriptState: {
				isRunning: false,
				hasRun: false,
			},
			runConfig: undefined,
			languageConfig: langConfig,
		};

		this.parseId();

		if (!this.state.uuidParseError) {
			this.state.runConfig = this.plugin.loadRunConfig(this.state.uuid, this.getDefaultRunConfig());
			this.scriptRunner = ScriptRunnerFactory.createScriptRunner(this.state.languageConfig.language, this.plugin, this.state.runConfig);
			this.scriptRunner.onScriptConsoleLog(() => {
				this.component.update();
			});

			this.scriptRunner.onScriptStart(() => {
				this.state.scriptState.isRunning = true;
				this.state.scriptState.hasRun = true;
				this.component.update();
			});
			this.scriptRunner.onSendInput(message => {
				this.scriptRunner?.scriptConsoleLogTrace(message);
			});
			this.scriptRunner.onTerminateScript((reason: string | Error) => {
				if (reason instanceof Error) {
					this.scriptRunner?.scriptConsoleLogError(`Script terminated because of error:\n${reason.message}`);
				} else {
					this.scriptRunner?.scriptConsoleLogWarn(`Script terminated because of:\n${reason}`);
				}
			});
			this.scriptRunner.onScriptEnd(code => {
				this.state.scriptState.isRunning = false;
				if (code === undefined) {
					this.component.update();
					return;
				}
				this.scriptRunner?.scriptConsoleLogTrace(`\n\nScript exited with code ${code ?? 0}`);
			});
		}
	}

	private getDefaultRunConfig(): RunConfiguration {
		return {
			uuid: this.state.uuid,
			executionPath: {
				mode: PathMode.FILE_RELATIVE,
				path: '',
			},
			scriptData: {
				scriptContent: this.state.codeBlockContent,
				scriptType: ScriptType.STRING,
				scriptConsole: [],
			},
			scriptArguments: [],
			overrides: {
				overrideDetached: false,
				detached: undefined,
				overrideCommandLineArguments: false,
				commandLineArguments: undefined,
			},
			language: this.state.languageConfig.language,
		};
	}

	private parseLanguage(): Language {
		if (!this.codeBlockLanguage) {
			throw Error('can not parse language, code block language is undefined or empty');
		}

		if (!this.codeBlockLanguage.endsWith('-runner')) {
			throw Error("can not parse language,, code block language does not end with '-runner'");
		}

		if (this.codeBlockLanguage.length < 8) {
			throw Error('can not parse language,, code block language to short');
		}

		const langStr: string = this.codeBlockLanguage.substring(0, this.codeBlockLanguage.length - 7);

		return LanguageMap[langStr] ?? Language.UNDEFINED;
	}

	getIdCommentPlaceHolder(): string {
		return `${this.state.languageConfig.commentString} ${idFieldName}: ${getPlaceholderUUID()}`;
	}

	private getIdFromComment(): string {
		if (!this.state) {
			throw Error('can not parse id comment, state is undefined');
		}

		if (!this.state.codeBlockContent) {
			throw Error('can not parse id comment, content is undefined or empty');
		}

		const rows: string[] = this.state.codeBlockContent.split('\n');

		if (rows.length === 0) {
			throw Error('can not parse id comment, content is empty');
		}

		const line: string = rows[0].trim();

		if (!line) {
			throw Error('can not parse id comment, the first line is empty');
		}

		if (!line.startsWith(this.state.languageConfig.commentString)) {
			throw Error('can not parse id comment, the first line not a comment');
		}

		let id: string = line.slice(this.state.languageConfig.commentString.length).trim();

		if (!id.startsWith(idFieldName)) {
			throw Error(`can not parse id comment, the comment does not start with '${idFieldName}'`);
		}

		id = id.slice(idFieldName.length).trim();

		if (!id.startsWith(':')) {
			throw Error(`can not parse id comment, parsing error, ':' expected`);
		}

		id = id.slice(1).trim();

		if (!id) {
			throw Error(`can not parse id comment, id is empty`);
		}

		return id;
	}

	private parseId(): void {
		try {
			this.state.uuid = this.getIdFromComment();
			this.state.uuidParseError = undefined;
		} catch (e) {
			this.state.uuid = '';
			this.state.uuidParseError = e.message;
		}
	}

	public onload(): void {
		console.log(this.state);

		this.component = new CodeRunnerMdRenderChild({
			target: this.containerEl,
			props: {
				renderChild: this,
			},
		});
	}
}
