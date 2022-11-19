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

export let lut: string[] = [];

export function initUUIDGen() {
	for (let i = 0; i < 256; i++) {
		lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
	}
}

export function getUUID() {
	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
		lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
		lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
		lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}
