import { describe, expect, it } from 'vitest';
import {
	MAGIC_ITEM_ROWS,
	SPELL_ROWS,
	WEAPON_CANTRIP_ROWS,
	createEmptyCharacterSheet,
	normalizeSheet
} from '../../src/lib/types';

describe('pre-populated row lists', () => {
	it('creates a new sheet with every printed row already present', () => {
		const sheet = createEmptyCharacterSheet();
		expect(sheet.weaponsAndCantrips).toHaveLength(WEAPON_CANTRIP_ROWS);
		expect(sheet.spells).toHaveLength(SPELL_ROWS);
		expect(sheet.magicItems).toHaveLength(MAGIC_ITEM_ROWS);
		// The rows are blank, not shared references.
		expect(sheet.spells[0]).toEqual({
			level: 0,
			name: '',
			castingTime: '',
			range: '',
			concentration: false,
			ritual: false,
			material: false,
			notes: ''
		});
		expect(sheet.spells[0]).not.toBe(sheet.spells[1]);
	});
});

describe('normalizeSheet', () => {
	/** A sheet as an older version would have stored it: short/empty row lists. */
	function legacySheet() {
		const sheet = createEmptyCharacterSheet();
		return {
			...sheet,
			weaponsAndCantrips: [{ name: 'Longsword', bonus: '+5', damage: '1d8+3', notes: '' }],
			spells: [
				{
					level: 1,
					name: 'Fireball',
					castingTime: '1 action',
					range: '150 ft',
					concentration: false,
					ritual: false,
					material: true,
					notes: 'Boom'
				}
			],
			magicItems: []
		} as typeof sheet & { spells: typeof sheet.spells };
	}

	it('tops up rows saved before the lists were pre-populated', () => {
		const sheet = normalizeSheet(legacySheet());
		expect(sheet.weaponsAndCantrips).toHaveLength(WEAPON_CANTRIP_ROWS);
		expect(sheet.spells).toHaveLength(SPELL_ROWS);
		expect(sheet.magicItems).toHaveLength(MAGIC_ITEM_ROWS);
	});

	it('keeps the values that were already there, in place', () => {
		const sheet = normalizeSheet(legacySheet());
		expect(sheet.weaponsAndCantrips[0].name).toBe('Longsword');
		expect(sheet.weaponsAndCantrips[1].name).toBe('');
		expect(sheet.spells[0].name).toBe('Fireball');
		expect(sheet.spells[1].name).toBe('');
	});

	it('never trims: a sheet holding more rows than the sheet prints is left alone', () => {
		const many = { ...createEmptyCharacterSheet() };
		many.spells = Array.from({ length: SPELL_ROWS + 7 }, (_, i) => ({
			level: 1,
			name: `Spell ${i}`,
			castingTime: '',
			range: '',
			concentration: false,
			ritual: false,
			material: false,
			notes: ''
		}));
		const sheet = normalizeSheet(many);
		expect(sheet.spells).toHaveLength(SPELL_ROWS + 7);
		expect(sheet.spells[SPELL_ROWS + 6].name).toBe(`Spell ${SPELL_ROWS + 6}`);
	});

	it('copes with missing or malformed lists instead of throwing', () => {
		const broken = { ...createEmptyCharacterSheet() } as Record<string, unknown>;
		delete broken.spells;
		broken.magicItems = null;
		broken.weaponsAndCantrips = 'nonsense';
		const sheet = normalizeSheet(broken as never);
		expect(sheet.spells).toHaveLength(SPELL_ROWS);
		expect(sheet.magicItems).toHaveLength(MAGIC_ITEM_ROWS);
		expect(sheet.weaponsAndCantrips).toHaveLength(WEAPON_CANTRIP_ROWS);
	});

	it('falls back to a fresh sheet when the stored value is not a sheet at all', () => {
		expect(normalizeSheet(null).spells).toHaveLength(SPELL_ROWS);
		expect(normalizeSheet(undefined).spells).toHaveLength(SPELL_ROWS);
		expect(normalizeSheet('oops' as never).spells).toHaveLength(SPELL_ROWS);
	});
});
