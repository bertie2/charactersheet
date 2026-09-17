import { gzipSync, gunzipSync } from 'fflate';
import { normalizeSheet, type CharacterSheet } from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Detect gzip by its magic bytes (0x1f 0x8b). */
export function isGzipped(bytes: Uint8Array): boolean {
	return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/** Serialize a character sheet into a gzipped JSON byte array. */
export function gzipSheet(sheet: CharacterSheet): Uint8Array {
	return gzipSync(encoder.encode(JSON.stringify(sheet)), { mtime: 0 });
}

/**
 * Deserialize a character sheet from gzipped JSON bytes.
 * Plain (non-gzipped) JSON is also accepted for backward compatibility.
 * Throws if the data is corrupt or not a valid character sheet.
 *
 * Export payloads from versions before the row lists were pre-populated are
 * normalised on the way in, so an old file lands on a sheet with every printed
 * row present. QR imports come through here too (`qrsToSheet`).
 */
export function gunzipSheet(bytes: Uint8Array): CharacterSheet {
	const raw = isGzipped(bytes) ? gunzipSync(bytes) : bytes;
	const parsed: unknown = JSON.parse(decoder.decode(raw));
	if (
		!parsed ||
		typeof parsed !== 'object' ||
		typeof (parsed as CharacterSheet).name !== 'string'
	) {
		throw new Error('Invalid character sheet data');
	}
	return normalizeSheet(parsed as CharacterSheet);
}

/** Build a downloadable gzip Blob for a character sheet. */
export function sheetBlob(sheet: CharacterSheet): Blob {
	// `.slice()` yields a Uint8Array<ArrayBuffer> (fresh copy) which Blob accepts.
	return new Blob([gzipSheet(sheet).slice()], { type: 'application/gzip' });
}
