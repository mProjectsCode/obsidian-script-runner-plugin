import * as Crypto from 'crypto';
import { TFile } from 'obsidian';

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
		super(`[OSR_INTERNAL_ERROR - please report this error] ${message}`);
	}
}

export class ScriptRunnerParsingError extends Error {
	constructor(message: string) {
		super(`[OSR_PARSING_ERROR] ${message}`);
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

export function getActiveFile(): TFile | null {
	// @ts-ignore undocumented but works
	return app.workspace.getActiveFile();
}

export function finLastIndex<T>(array: T[], callback: (element: T, index: number, array: T[]) => boolean): number {
	for (let i = array.length - 1; i >= 0; i--) {
		if (callback(array[i], i, array)) {
			return i;
		}
	}
	return -1;
}

export function stripEmptyLinesAtBeginning(lines: string[]): string[] {
	const newLines: string[] = [];

	let inEmptyLinesAtStart = true;
	for (let i = 0; i < lines.length; i++) {
		if (inEmptyLinesAtStart && lines[i]) {
			inEmptyLinesAtStart = false;
		}

		if (!inEmptyLinesAtStart) {
			newLines.push(lines[i]);
		}
	}

	return newLines;
}

/**
 * Gets the file name from a path
 *
 * @param path
 */
export function getFileName(path: string): string {
	return path.split('/').at(-1) ?? path;
}

/**
 * Checks if a path is a path or a file name
 *
 * @param path
 */
export function isPath(path: string): boolean {
	return path.split('/').at(-1)?.split('.').length === 1;
}

/**
 * Removes the file ending of a file name
 *
 * @param fileName
 */
export function removeFileEnding(fileName: string): string {
	const fileNameParts = fileName.split('.');
	if (fileNameParts.length === 1) {
		return fileName;
	} else {
		let newFileName = fileNameParts[0];
		for (let i = 1; i < fileNameParts.length - 1; i++) {
			newFileName += '.' + fileNameParts[i];
		}
		return newFileName;
	}
}
