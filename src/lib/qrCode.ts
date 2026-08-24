import { gzipSheet, gunzipSheet } from './sheetIO';
import type { CharacterSheet } from './types';

/**
 * QR transfer util.
 *
 * A character sheet is serialized (gzip, base64) and split into one or more
 * QR-code payloads. Each payload is tagged so unrelated QR codes are ignored
 * when scanning. The `qrcode` library is loaded lazily (client-only) in
 * `renderQrToCanvas`.
 */

/** Prefix tagging each chunk as one of our character-sheet QR codes. */
export const QR_CHUNK_MAGIC = 'CHSHEET';
/** Error-correction level used when rendering. */
export const QR_ERROR_CORRECTION = 'M' as const;
/** Upper bound on base64 payload chars per QR code (keeps each QR within capacity). */
export const QR_MAX_CHUNK_CHARS = 1800;
/** Largest QR module grid (version 40). */
export const QR_MAX_MODULES = 177;
/** Smallest QR module grid (version 1). */
export const QR_MIN_MODULES = 21;
/**
 * Minimum physical (device) pixels per QR module so the code stays scannable.
 * Used to pick a chunk size from the display resolution: smaller screens get
 * more, smaller (lower-density) QR codes.
 */
export const MIN_MODULE_PX = 2.5;

/**
 * Lowercase-only filler forces `qrcode` to use byte mode (real base64 payloads
 * mix cases, so byte mode always applies). Byte capacity is identical for every
 * 1-byte character, so this estimates the version exactly.
 */
function samplePayload(len: number): string {
	return 'a'.repeat(len);
}

export interface QrChunk {
	total: number;
	index: number; // 1-based
	data: string; // base64 segment
}

function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/** Split a character sheet into one or more QR-code payload strings. */
export function sheetToQrChunks(
	sheet: CharacterSheet,
	maxChunkChars = QR_MAX_CHUNK_CHARS
): string[] {
	const b64 = toBase64(gzipSheet(sheet));
	const size = Math.max(1, Math.min(QR_MAX_CHUNK_CHARS, Math.floor(maxChunkChars)));
	const total = Math.max(1, Math.ceil(b64.length / size));
	const chunks: string[] = [];
	for (let i = 0; i < total; i++) {
		const data = b64.slice(i * size, (i + 1) * size);
		chunks.push(`${QR_CHUNK_MAGIC}|${total}|${i + 1}|${data}`);
	}
	return chunks;
}

/** Parse a scanned QR payload into a chunk, or `null` if it is not one of ours. */
export function parseQrChunk(text: string): QrChunk | null {
	if (typeof text !== 'string') return null;
	const parts = text.split('|');
	if (parts.length !== 4 || parts[0] !== QR_CHUNK_MAGIC) return null;
	const total = Number(parts[1]);
	const index = Number(parts[2]);
	const data = parts[3] ?? '';
	if (!Number.isInteger(total) || !Number.isInteger(index)) return null;
	if (total < 1 || index < 1 || index > total || data.length === 0) return null;
	return { total, index, data };
}

/** Reassemble a character sheet from all of its QR chunks. */
export function qrsToSheet(chunks: QrChunk[]): CharacterSheet {
	if (chunks.length === 0) throw new Error('No QR chunks provided');
	const total = chunks[0].total;
	if (chunks.some((c) => c.total !== total)) throw new Error('Mismatched QR chunk sets');
	if (chunks.length !== total) throw new Error(`Incomplete QR set: ${chunks.length}/${total}`);

	const parts: (string | undefined)[] = new Array(total);
	for (const c of chunks) {
		if (parts[c.index - 1] !== undefined) throw new Error(`Duplicate QR chunk ${c.index}`);
		parts[c.index - 1] = c.data;
	}
	if (parts.some((p) => p === undefined)) throw new Error('Missing QR chunk');

	return gunzipSheet(fromBase64((parts as string[]).join('')));
}

/** Render a QR code onto a canvas. The `qrcode` library is loaded lazily (client-only). */
export async function renderQrToCanvas(
	text: string,
	canvas: HTMLCanvasElement,
	width = 600
): Promise<void> {
	const { default: QRCode } = await import('qrcode');
	await QRCode.toCanvas(canvas, text, {
		errorCorrectionLevel: QR_ERROR_CORRECTION,
		margin: 2,
		width,
		color: { dark: '#000000', light: '#ffffff' }
	});
	// qrcode writes inline width/height styles that would override our responsive
	// CSS and warp the QR out of square — strip them so the canvas scales cleanly.
	canvas.style.width = '';
	canvas.style.height = '';
}

/**
 * Largest chunk payload (data chars, header excluded) whose QR stays within
 * `maxModules` modules per side at the configured error-correction level.
 * Sampled with byte-mode data (lowercase base64) so the estimate matches the
 * real payloads; the header is budgeted generously so the emitted chunks always
 * fit. The `qrcode` library is loaded lazily (client-only).
 */
export async function computeMaxChunkChars(maxModules: number): Promise<number> {
	const { default: QRCode } = await import('qrcode');
	const max = Math.min(QR_MAX_MODULES, Math.max(QR_MIN_MODULES, Math.floor(maxModules)));
	// Longest plausible header (total/index up to 4 digits) on top of the data.
	const headerBudget = `${QR_CHUNK_MAGIC}|9999|9999|`;
	const fits = (dataLen: number) =>
		QRCode.create(headerBudget + samplePayload(dataLen), {
			errorCorrectionLevel: QR_ERROR_CORRECTION
		}).modules.size <= max;
	if (fits(QR_MAX_CHUNK_CHARS)) return QR_MAX_CHUNK_CHARS;
	let lo = 1;
	let hi = QR_MAX_CHUNK_CHARS;
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		if (fits(mid)) lo = mid;
		else hi = mid - 1;
	}
	return lo;
}

/**
 * Pick a chunk size for a display that has `displayPx` physical (device) pixels
 * of width available for the QR. Smaller screens yield more, smaller QR codes so
 * each module stays large enough to scan reliably.
 */
export async function resolveChunkChars(displayPx: number): Promise<number> {
	const maxModules = Math.min(
		QR_MAX_MODULES,
		Math.max(QR_MIN_MODULES, Math.floor(displayPx / MIN_MODULE_PX))
	);
	return computeMaxChunkChars(maxModules);
}
