import * as Crypto from 'crypto';
import {TFile} from 'obsidian';

export function isTruthy(value: any): boolean {
	return !!value;
}

export function isFalsy(value: any): boolean {
	return !value;
}

export function equalOrIncludes(str1: string, str2: string): boolean {
	return str1 === str2 || str1.includes(str2) || str2.includes(str1);
}

export class ScriptRunnerInternalError extends Error {
	constructor(message: string) {
		super(`[TTU_INTERNAL_ERROR - please report this error] ${message}`);
	}
}

export class ScriptRunnerParsingError extends Error {
	constructor(message: string) {
		super(`[TTU_PARSING_ERROR] ${message}`);
	}
}

export function getUUID(): string {
	return Crypto.randomUUID();
}

export function getPlaceholderUUID(): string {
	return 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
}

export function getVaultBasePath(): string {
	// @ts-ignore undocumented but works
	return app.vault.adapter.getBasePath();
}

export function getActiveFile(): TFile {
	// @ts-ignore undocumented but works
	return app.workspace.getActiveFile();
}