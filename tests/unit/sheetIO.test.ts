import { describe, expect, it } from 'vitest';
import { gzipSheet, gunzipSheet, isGzipped, sheetBlob } from '../../src/lib/sheetIO';
import { createEmptyCharacterSheet } from '../../src/lib/types';

/** Build a fully-populated sheet to exercise the round-trip. */
function filledSheet() {
	const s = createEmptyCharacterSheet();
	// page 1
	s.name = 'Aragorn';
	s.background = 'Outlander';
	s.class = 'Ranger';
	s.species = 'Human';
	s.subsclass = 'Hunter';
	s.level = 5;
	s.experience = 6500;
	s.armourClass = 17;
	s.hitPoints = 44;
	s.maxHitPoints = 44;
	s.tempHitPoints = 2;
	s.proficiencyBonus = 3;
	s.initiative = 4;
	s.speed = 30;
	s.size = 'Medium';
	s.passivePerception = 15;
	s.strengthScore = 16;
	s.strengthModifier = 3;
	s.dexterityScore = 18;
	s.dexterityModifier = 4;
	s.constitutionScore = 14;
	s.constitutionModifier = 2;
	s.athletics = 6;
	s.stealth = 8;
	s.weaponsProficiencys = 'Longsword, Longbow';
	s.weaponsAndCantrips = [
		{ name: 'Longsword', bonus: '+7', damage: '1d8+4', notes: 'Versatile' },
		{ name: 'Longbow', bonus: '+8', damage: '1d8+4', notes: 'Range 150/600' }
	];
	s.classFeatures1 = 'Favored Enemy';
	s.speciesTraits = 'Darkvision';
	s.feats = 'Sharpshooter';

	// page 2
	s.spellcastingAbility = 'Wisdom';
	s.spellCastingModifier = 5;
	s.spellSaveDC = 15;
	s.spellAttackBonus = 7;
	s.spells = [
		{
			level: 1,
			name: "Hunter's Mark",
			castingTime: '1 bonus action',
			range: '90 ft',
			concentration: true,
			ritual: false,
			material: false,
			notes: '1d6 extra damage'
		}
	];
	s.appearance = 'Rugged ranger with a grey cloak';
	s.backstory = 'Grew up in the northern wilds.';
	s.alignment = 'Neutral Good';
	s.languages = 'Common, Elvish, Orc';
	s.equipment = 'Longsword, Longbow, quiver, explorer pack';
	s.magicItems = [
		{ attuned: true, name: 'Boots of Elvenkind' },
		{ attuned: false, name: 'Cloak of the Manta Ray' }
	];
	s.copperPieces = 8;
	s.silverPieces = 5;
	s.goldPieces = 120;
	s.platinumPieces = 1;
	s.spellSlots[0] = { level: 1, current: 3, max: 4 };
	return s;
}

describe('character sheet gzip round-trip', () => {
	it('gzip output is actually gzip and smaller than raw JSON', () => {
		const original = filledSheet();
		const bytes = gzipSheet(original);
		const raw = new TextEncoder().encode(JSON.stringify(original));

		expect(isGzipped(bytes)).toBe(true);
		expect(bytes.length).toBeLessThan(raw.length);
		expect(bytes[0]).toBe(0x1f);
		expect(bytes[1]).toBe(0x8b);
	});

	it('exports and imports back to identical values', () => {
		const original = filledSheet();
		const bytes = gzipSheet(original);
		const restored = gunzipSheet(bytes);

		expect(restored).toEqual(original);
	});

	it('round-trips through a Blob (what the UI downloads/uploads)', async () => {
		const original = filledSheet();
		const blob = sheetBlob(original);
		const buffer = await blob.arrayBuffer();
		const restored = gunzipSheet(new Uint8Array(buffer));
		expect(restored).toEqual(original);
	});

	it('is deterministic for the same sheet (fixed mtime)', () => {
		const sheet = filledSheet();
		const a = gzipSheet(sheet);
		const b = gzipSheet(sheet);
		expect(a).toEqual(b);
	});

	it('accepts plain (non-gzipped) JSON for backward compatibility', () => {
		const original = filledSheet();
		const plain = new TextEncoder().encode(JSON.stringify(original));
		const restored = gunzipSheet(plain);
		expect(restored).toEqual(original);
	});

	it('rejects corrupt or invalid data', () => {
		expect(() => gunzipSheet(new TextEncoder().encode('this is not json'))).toThrow();
		expect(() => gunzipSheet(new TextEncoder().encode('{"name":123}'))).toThrow();
		// random bytes that happen to start with the gzip magic
		expect(() =>
			gunzipSheet(new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff, 0xff, 0x00, 0x00]))
		).toThrow();
	});
});
