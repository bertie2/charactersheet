import { describe, expect, it } from 'vitest';
import {
	SPELL_SLOT_ROWS,
	TICK_PITCH,
	TICK_SIZE,
	applyExpended,
	expendedSlots,
	nextExpended,
	tickRect
} from '../../src/lib/spellSlots';

describe('spell slot tick rows', () => {
	it('covers all nine levels with the printed number of tick targets', () => {
		expect(SPELL_SLOT_ROWS).toHaveLength(9);
		expect(SPELL_SLOT_ROWS.map((r) => r.ticks)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
		// 4 for 1st level down to a single box for 8th and 9th, never more than 4.
		expect(Math.max(...SPELL_SLOT_ROWS.map((r) => r.ticks))).toBe(4);
		expect(Math.min(...SPELL_SLOT_ROWS.map((r) => r.ticks))).toBe(1);
	});

	it('indexes levels in order and offers one offset per target', () => {
		SPELL_SLOT_ROWS.forEach((row, level) => {
			expect(row.level).toBe(level);
			expect(row.offsets).toEqual(Array.from({ length: row.ticks }, (_, i) => i));
		});
	});
});

describe('expendedSlots', () => {
	it('is the difference between the total and what is left', () => {
		expect(expendedSlots({ max: 4, current: 4 }, 4)).toBe(0);
		expect(expendedSlots({ max: 4, current: 1 }, 4)).toBe(3);
		expect(expendedSlots({ max: 2, current: 0 }, 2)).toBe(2);
	});

	it('is clamped to the boxes the artwork actually prints', () => {
		// 5th level prints 3 targets, so a 5-slot sheet can still only tick 3.
		expect(expendedSlots({ max: 5, current: 0 }, 3)).toBe(3);
		expect(expendedSlots({ max: 1, current: -2 }, 3)).toBe(1);
		expect(expendedSlots({ max: 0, current: 0 }, 4)).toBe(0);
	});

	it('survives missing or non-numeric values from older saved sheets', () => {
		const legacy = { max: undefined, current: undefined } as unknown as {
			max: number;
			current: number;
		};
		expect(expendedSlots(legacy, 4)).toBe(0);
		const strings = { max: '4', current: '1' } as unknown as { max: number; current: number };
		expect(expendedSlots(strings, 4)).toBe(3);
	});
});

describe('applyExpended', () => {
	it('keeps max - current equal to the tally', () => {
		const slot = applyExpended({ level: 1, max: 4, current: 4 }, 2);
		expect(slot).toEqual({ level: 1, max: 4, current: 2 });
	});

	it('raises the total when the tally outgrows it, so a tick always registers', () => {
		expect(applyExpended({ level: 1, max: 0, current: 0 }, 3)).toEqual({
			level: 1,
			max: 3,
			current: 0
		});
	});

	it('never records a negative number of slots left', () => {
		const slot = applyExpended({ level: 5, max: 2, current: 2 }, 3);
		expect(slot.max).toBe(3);
		expect(slot.current).toBe(0);
	});
});

describe('nextExpended', () => {
	it('fills up to the tick that was clicked', () => {
		expect(nextExpended(0, 0)).toBe(1);
		expect(nextExpended(0, 3)).toBe(4);
		expect(nextExpended(2, 3)).toBe(4);
	});

	it('clears the clicked tick and everything after it', () => {
		expect(nextExpended(4, 3)).toBe(3);
		expect(nextExpended(4, 0)).toBe(0);
		expect(nextExpended(1, 0)).toBe(0);
	});

	it('round-trips with expendedSlots for a whole row', () => {
		const ticks = SPELL_SLOT_ROWS[0].ticks;
		let slot = { level: 1, max: 4, current: 4 };

		/** Click a box and report the tally it left behind. */
		const click = (index: number) => {
			slot = applyExpended(slot, nextExpended(expendedSlots(slot, ticks), index));
			return expendedSlots(slot, ticks);
		};

		expect(click(2)).toBe(3); // fill up to the 3rd box
		expect(click(3)).toBe(4); // and the 4th
		expect(click(1)).toBe(1); // a ticked box clears itself and everything after it
		expect(click(0)).toBe(0); // clear the row
		expect(slot.current).toBe(slot.max); // nothing left expended
	});
});

describe('tickRect', () => {
	it('centres each box on its printed target', () => {
		const row = SPELL_SLOT_ROWS[0];
		const first = tickRect(row, 0);
		const second = tickRect(row, 1);
		expect(first.width).toBe(TICK_SIZE);
		expect(first.height).toBe(TICK_SIZE);
		expect(first.x).toBeCloseTo(row.tickX - TICK_SIZE / 2, 5);
		expect(first.y).toBeCloseTo(row.tickY - TICK_SIZE / 2, 5);
		expect(second.x).toBeCloseTo(row.tickX + TICK_PITCH - TICK_SIZE / 2, 5);
	});

	it('sits the boxes inside the printed targets without overlapping', () => {
		expect(TICK_SIZE).toBeLessThan(TICK_PITCH);
		for (const row of SPELL_SLOT_ROWS) {
			expect(row.tickX - TICK_SIZE / 2).toBeGreaterThan(0);
			expect(row.tickY - TICK_SIZE / 2).toBeGreaterThan(0);
		}
	});
});
