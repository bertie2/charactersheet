import { describe, expect, it } from 'vitest';
import {
	computeMaxChunkChars,
	parseQrChunk,
	QR_MAX_CHUNK_CHARS,
	QR_MAX_MODULES,
	qrsToSheet,
	resolveChunkChars,
	sheetToQrChunks
} from '../../src/lib/qrCode';
import { createEmptyCharacterSheet } from '../../src/lib/types';

/** Build a sheet large enough to span multiple QR codes. */
function bigSheet() {
	const s = createEmptyCharacterSheet();
	s.name = 'QR Transfer Test';
	s.class = 'Bard';
	s.level = 12;
	s.weaponsAndCantrips = Array.from({ length: 20 }, (_, i) => ({
		name: `Weapon ${i}`,
		bonus: `+${i}`,
		damage: `1d${i + 1}`,
		notes: `Note ${i} with some extra detail text here`
	}));
	s.spells = Array.from({ length: 60 }, (_, i) => ({
		level: i % 10,
		name: `Spell Number ${i}`,
		castingTime: '1 action',
		range: '60 ft',
		concentration: i % 2 === 0,
		ritual: false,
		material: false,
		notes: `A fairly long note describing spell number ${i} in detail.`
	}));
	s.backstory = 'A long backstory for the character. '.repeat(40);
	s.equipment = 'Sword, shield, rope, lantern, potions, backpack, rations. '.repeat(30);
	return s;
}

describe('QR chunk protocol', () => {
	it('splits a large sheet into multiple QR chunks and reassembles it', () => {
		const sheet = bigSheet();
		const chunks = sheetToQrChunks(sheet);
		expect(chunks.length).toBeGreaterThan(1);

		const parsed = chunks.map((c) => parseQrChunk(c)).filter((c) => c !== null);
		expect(parsed.length).toBe(chunks.length);
		expect(qrsToSheet(parsed)).toEqual(sheet);
	});

	it('each chunk payload stays within QR byte-mode capacity', () => {
		const sheet = bigSheet();
		for (const c of sheetToQrChunks(sheet)) {
			expect(c.length).toBeLessThanOrEqual(QR_MAX_CHUNK_CHARS + 32);
		}
	});

	it('reassembles chunks regardless of scan order', () => {
		const sheet = bigSheet();
		const chunks = sheetToQrChunks(sheet).map((c) => parseQrChunk(c)!);
		expect(qrsToSheet([...chunks].reverse())).toEqual(sheet);
	});

	it('produces a single chunk for a small sheet', () => {
		const sheet = createEmptyCharacterSheet();
		const chunks = sheetToQrChunks(sheet);
		expect(chunks.length).toBe(1);
		expect(qrsToSheet([parseQrChunk(chunks[0])!])).toEqual(sheet);
	});

	it('ignores unrelated QR payloads', () => {
		expect(parseQrChunk('https://example.com')).toBeNull();
		expect(parseQrChunk('CHSHEET|2|1|')).toBeNull(); // empty data
		expect(parseQrChunk('CHSHEET|2|3|abc')).toBeNull(); // index out of range
		expect(parseQrChunk('CHSHEET|0|1|abc')).toBeNull(); // invalid total
		expect(parseQrChunk('')).toBeNull();
	});

	it('rejects incomplete or duplicate sets', () => {
		const chunks = sheetToQrChunks(bigSheet()).map((c) => parseQrChunk(c)!);
		expect(() => qrsToSheet(chunks.slice(0, -1))).toThrow();
		expect(() => qrsToSheet([chunks[0], chunks[0]])).toThrow();
		expect(() => qrsToSheet([])).toThrow();
	});
});

describe('device-aware chunk sizing', () => {
	it('computeMaxChunkChars never exceeds the upper bound', async () => {
		// A full-resolution display (max modules) still respects the cap.
		expect(await computeMaxChunkChars(QR_MAX_MODULES)).toBe(QR_MAX_CHUNK_CHARS);
		// An enormous budget still caps at the maximum.
		expect(await computeMaxChunkChars(10_000)).toBe(QR_MAX_CHUNK_CHARS);
	});

	it('computeMaxChunkChars shrinks the chunk size as the module budget shrinks', async () => {
		const huge = await computeMaxChunkChars(QR_MAX_MODULES);
		const small = await computeMaxChunkChars(50);
		expect(small).toBeGreaterThan(0);
		expect(small).toBeLessThan(huge);
	});

	it('resolveChunkChars uses more, smaller chunks on low-resolution displays', async () => {
		const sheet = bigSheet();
		const hiRes = await resolveChunkChars(2800); // e.g. a large high-dpi screen
		const loRes = await resolveChunkChars(280); // e.g. a small low-dpi screen
		expect(loRes).toBeLessThanOrEqual(hiRes);
		expect(sheetToQrChunks(sheet, loRes).length).toBeGreaterThanOrEqual(
			sheetToQrChunks(sheet, hiRes).length
		);
	});

	it('chunks built with a smaller size still reassemble to the original sheet', async () => {
		const sheet = bigSheet();
		const size = await resolveChunkChars(280);
		const chunks = sheetToQrChunks(sheet, size).map((c) => parseQrChunk(c)!);
		expect(chunks.length).toBeGreaterThan(1);
		expect(qrsToSheet(chunks)).toEqual(sheet);
	});

	it('every chunk emitted at a smaller size stays within the QR module budget', async () => {
		const { default: QRCode } = await import('qrcode');
		const sheet = bigSheet();
		const size = await resolveChunkChars(280);
		// 280 physical px ÷ 2.5 px/module ≈ a 112-module budget.
		const defaultModules = QRCode.create(sheetToQrChunks(sheet)[0], {
			errorCorrectionLevel: 'M'
		}).modules.size;
		for (const c of sheetToQrChunks(sheet, size)) {
			const modules = QRCode.create(c, { errorCorrectionLevel: 'M' }).modules.size;
			expect(modules).toBeLessThanOrEqual(112);
			expect(modules).toBeLessThan(defaultModules);
		}
	});
});
