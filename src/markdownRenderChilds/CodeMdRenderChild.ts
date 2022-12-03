import {MarkdownRenderChild} from 'obsidian';
import {RunConfiguration} from '../RunConfiguration';
import ScriptRunnerPlugin from '../main';
import {getDefaultLanguageCofigForLanguage, LanguageConfiguration} from '../LanguageConfiguration';
import {getPlaceholderUUID} from '../utils/Utils';
import {Language} from '../scriptRunners/AbstractScriptRunner';
// @ts-ignore
import {CodeRunnerMdRenderChild} from './CodeRunnerMdRenderChild.svelte';

export interface CodeMdRenderChildState {
	uuid: string,
	uuidParseError: string | undefined,
	codeBlockContent: string,
	scriptState: ScriptState,
	runConfig?: RunConfiguration,
	languageConfig: LanguageConfiguration
}

export interface ScriptState {
	isRunning: boolean,
	hasRun: boolean,
}

const idFieldName: string = 'script-id';

export class CodeMdRenderChild extends MarkdownRenderChild {
	plugin: ScriptRunnerPlugin;
	state: CodeMdRenderChildState;
	codeBlockLanguage: string;
	component: CodeRunnerMdRenderChild;

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

		const langStr = this.codeBlockLanguage.substring(0, this.codeBlockLanguage.length - 7);

		return langStr as Language;
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

		});
	}
}
