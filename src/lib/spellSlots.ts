import type { SpellSlot } from './types';

/**
 * The printed "spell slots expended" tally on `page2.png`.
 *
 * Each level row prints a row of tick targets — 4 for 1st level, 3 for 2nd–5th,
 * 2 for 6th–7th and 1 for 8th/9th — across the strip the old "current" number box
 * used to cover, with a plain box to their left for the slot total.
 *
 * Coordinates are in the sheet's design units (1/1000th of the sheet height, the
 * same grid `Input` renders into `cqh`), measured off the artwork, so the ticks
 * land on the printed targets at any zoom. Keep them in step with `page2.png`.
 */
export const TICK_PITCH = 12.25;
export const TICK_SIZE = 11;

export interface SpellSlotRow {
	/** 0-based index into `CharacterSheet.spellSlots`. */
	level: number;
	/** Printed tick targets in this row. */
	ticks: number;
	/** Offsets used to render the row — `[0, 1, ... ticks - 1]`. */
	offsets: number[];
	/** Centre of the first tick target. */
	tickX: number;
	/** Centre of the tick row. */
	tickY: number;
	/** The plain "slot total" number box to the left of the tally. */
	max: { x: number; width: number; y: number };
}

const rows: Omit<SpellSlotRow, 'offsets'>[] = [
	{ level: 0, ticks: 4, tickX: 261.9, tickY: 116.7, max: { x: 233, width: 20, y: 108 } },
	{ level: 1, ticks: 3, tickX: 261.9, tickY: 134.4, max: { x: 233, width: 20, y: 125 } },
	{ level: 2, ticks: 3, tickX: 261.9, tickY: 151.5, max: { x: 233, width: 20, y: 143 } },
	{ level: 3, ticks: 3, tickX: 375.8, tickY: 116.7, max: { x: 348, width: 20, y: 108 } },
	{ level: 4, ticks: 3, tickX: 375.8, tickY: 134.4, max: { x: 348, width: 20, y: 125 } },
	{ level: 5, ticks: 2, tickX: 375.5, tickY: 151.5, max: { x: 348, width: 20, y: 143 } },
	{ level: 6, ticks: 2, tickX: 477.2, tickY: 116.7, max: { x: 450, width: 20, y: 108 } },
	{ level: 7, ticks: 1, tickX: 477.2, tickY: 134.4, max: { x: 450, width: 20, y: 125 } },
	{ level: 8, ticks: 1, tickX: 477.2, tickY: 151.5, max: { x: 450, width: 20, y: 143 } }
];

export const SPELL_SLOT_ROWS: SpellSlotRow[] = rows.map((row) => ({
	...row,
	offsets: Array.from({ length: row.ticks }, (_, index) => index)
}));

/**
 * How many slots are expended: the tally is `max - current` (the model stores the
 * slots that are *left*), clamped to the boxes actually printed for the row.
 */
export function expendedSlots(slot: Pick<SpellSlot, 'current' | 'max'>, ticks: number): number {
	const total = Math.max(0, Number(slot?.max) || 0);
	// A saved sheet can carry nonsense here (negative, or more left than the
	// total), so pin what is left inside the total before doing the arithmetic.
	const left = Math.min(total, Math.max(0, Number(slot?.current) || 0));
	return Math.min(ticks, total - left);
}

/**
 * Writes a new tally back to the slot. Ticking past the recorded total raises it,
 * so a tick always registers even on a sheet with no total filled in yet; the
 * accounting stays consistent because `current` is always `max - expended`.
 */
export function applyExpended(slot: SpellSlot, expended: number): SpellSlot {
	const max = Math.max(Number(slot?.max) || 0, expended);
	return { ...slot, max, current: max - expended };
}

/**
 * The tally after clicking tick `index`: fills up to and including it, or — when
 * that tick is already part of the tally — clears it and everything after it.
 */
export function nextExpended(expended: number, index: number): number {
	return index < expended ? index : index + 1;
}

/** Where tick `index` sits, in design units — feed straight into `Input`. */
export function tickRect(
	row: SpellSlotRow,
	index: number
): {
	x: number;
	y: number;
	width: number;
	height: number;
} {
	return {
		x: row.tickX + index * TICK_PITCH - TICK_SIZE / 2,
		y: row.tickY - TICK_SIZE / 2,
		width: TICK_SIZE,
		height: TICK_SIZE
	};
}
