export interface WeaponCantrip {
	name: string;
	bonus: string;
	damage: string;
	notes: string;
}

export interface Spell {
	level: number;
	name: string;
	castingTime: string;
	range: string;
	concentration: boolean;
	ritual: boolean;
	material: boolean;
	notes: string;
}

export interface MagicItemAtunment {
	attuned: boolean;
	name: string;
}

export interface SpellSlot {
	level: number;
	current: number;
	max: number;
}

export interface CharacterSheet {
	// page 1
	name: string;
	background: string;
	class: string;
	species: string;
	subsclass: string;
	level: number;
	experience: number;
	armourClass: number;
	shield: boolean;
	hitPoints: number;
	tempHitPoints: number;
	maxHitPoints: number;
	spentHitDice: number;
	maxHitDice: number;
	deathSaveSuccesses: number;
	deathSaveFailures: number;
	proficiencyBonus: number;
	initiative: number;
	speed: number;
	size: string;
	passivePerception: number;
	strengthModifier: number;
	strengthScore: number;
	strengthSavingThrowProficiency: boolean;
	strengthSavingThrow: number;
	athleticsProficiency: boolean;
	athletics: number;
	dexterityModifier: number;
	dexterityScore: number;
	dexteritySavingThrowProficiency: boolean;
	dexteritySavingThrow: number;
	acrobaticsProficiency: boolean;
	acrobatics: number;
	sleightOfHandProficiency: boolean;
	sleightOfHand: number;
	stealthProficiency: boolean;
	stealth: number;
	constitutionModifier: number;
	constitutionScore: number;
	constitutionSavingThrowProficiency: boolean;
	constitutionSavingThrow: number;
	intelligenceModifier: number;
	intelligenceScore: number;
	intelligenceSavingThrowProficiency: boolean;
	intelligenceSavingThrow: number;
	arcanaProficiency: boolean;
	arcana: number;
	historyProficiency: boolean;
	history: number;
	investigationProficiency: boolean;
	investigation: number;
	natureProficiency: boolean;
	nature: number;
	religionProficiency: boolean;
	religion: number;
	wisdomModifier: number;
	wisdomScore: number;
	wisdomSavingThrowProficiency: boolean;
	wisdomSavingThrow: number;
	animalHandlingProficiency: boolean;
	animalHandling: number;
	insightProficiency: boolean;
	insight: number;
	medicineProficiency: boolean;
	medicine: number;
	perceptionProficiency: boolean;
	perception: number;
	survivalProficiency: boolean;
	survival: number;
	charismaModifier: number;
	charismaScore: number;
	charismaSavingThrowProficiency: boolean;
	charismaSavingThrow: number;
	deceptionProficiency: boolean;
	deception: number;
	intimidationProficiency: boolean;
	intimidation: number;
	performanceProficiency: boolean;
	performance: number;
	persuasionProficiency: boolean;
	persuasion: number;
	heroicInspiration: boolean;
	lightArmourProficiency: boolean;
	mediumArmourProficiency: boolean;
	heavyArmourProficiency: boolean;
	shieldProficiency: boolean;
	weaponsProficiencys: string;
	toolsProficiencys: string;
	weaponsAndCantrips: WeaponCantrip[];
	classFeatures1: string;
	classFeatures2: string;
	speciesTraits: string;
	feats: string;

	// page 2
	spellcastingAbility: string;
	spellCastingModifier: number;
	spellSaveDC: number;
	spellAttackBonus: number;
	spells: Spell[];
	appearance: string;
	backstory: string;
	alignment: string;
	languages: string;
	equipment: string;
	magicItems: MagicItemAtunment[];
	copperPieces: number;
	silverPieces: number;
	electrumPieces: number;
	goldPieces: number;
	platinumPieces: number;

	spellSlots: SpellSlot[];
}

export function createEmptyWeaponCantrip(): WeaponCantrip {
	return {
		name: '',
		bonus: '',
		damage: '',
		notes: ''
	};
}

export function createEmptySpell(): Spell {
	return {
		level: 0,
		name: '',
		castingTime: '',
		range: '',
		concentration: false,
		ritual: false,
		material: false,
		notes: ''
	};
}

export function createEmptyMagicItemAttunment(): MagicItemAtunment {
	return {
		attuned: false,
		name: ''
	};
}

/*
 * How many rows each list prints on the sheet. Every row is drawn ahead of time
 * (there are no add/remove buttons), so these counts decide how many inputs sit
 * on the artwork. Measured from the printed rules: the page 1 weapons box has 6
 * rows, page 2 has 30 spell rows (rules at a constant 25.1 unit pitch from
 * y 248.8 down to 977.2) and 3 magic item rows.
 */
export const WEAPON_CANTRIP_ROWS = 6;
export const SPELL_ROWS = 30;
export const MAGIC_ITEM_ROWS = 3;

/**
 * Tops a row list up to `count`, leaving anything already on the sheet alone.
 * Lists are never trimmed: a sheet written before the rows were pre-populated
 * (or one that genuinely holds more entries) keeps every value it has.
 */
function withRows<T>(rows: T[] | undefined, count: number, create: () => T): T[] {
	const existing = Array.isArray(rows) ? rows : [];
	if (existing.length >= count) return existing;
	return [...existing, ...Array.from({ length: count - existing.length }, () => create())];
}

/**
 * Brings a sheet loaded from an older version up to date with the current shape.
 *
 * The only thing that has changed is that the weapon, spell and magic item lists
 * arrive pre-filled with empty rows, so sheets saved or exported before that are
 * padded here. Everything else is passed through untouched, which keeps old
 * localStorage entries, `*.json.gz` exports and QR payloads working.
 */
export function normalizeSheet(sheet: CharacterSheet | null | undefined): CharacterSheet {
	if (!sheet || typeof sheet !== 'object') return createEmptyCharacterSheet();
	return {
		...sheet,
		weaponsAndCantrips: withRows(
			sheet.weaponsAndCantrips,
			WEAPON_CANTRIP_ROWS,
			createEmptyWeaponCantrip
		),
		spells: withRows(sheet.spells, SPELL_ROWS, createEmptySpell),
		magicItems: withRows(sheet.magicItems, MAGIC_ITEM_ROWS, createEmptyMagicItemAttunment)
	};
}

export function createEmptyCharacterSheet(): CharacterSheet {
	return {
		name: '',
		background: '',
		class: '',
		species: '',
		subsclass: '',
		level: 1,
		experience: 0,
		armourClass: 10,
		shield: false,
		hitPoints: 10,
		tempHitPoints: 0,
		maxHitPoints: 10,
		spentHitDice: 0,
		maxHitDice: 1,
		deathSaveSuccesses: 0,
		deathSaveFailures: 0,
		proficiencyBonus: 2,
		initiative: 0,
		speed: 30,
		size: 'Medium',
		passivePerception: 10,
		strengthModifier: 0,
		strengthScore: 10,
		strengthSavingThrowProficiency: false,
		strengthSavingThrow: 0,
		athleticsProficiency: false,
		athletics: 0,
		dexterityModifier: 0,
		dexterityScore: 10,
		dexteritySavingThrowProficiency: false,
		dexteritySavingThrow: 0,
		acrobaticsProficiency: false,
		acrobatics: 0,
		sleightOfHandProficiency: false,
		sleightOfHand: 0,
		stealthProficiency: false,
		stealth: 0,
		constitutionModifier: 0,
		constitutionScore: 10,
		constitutionSavingThrowProficiency: false,
		constitutionSavingThrow: 0,
		intelligenceModifier: 0,
		intelligenceScore: 10,
		intelligenceSavingThrowProficiency: false,
		intelligenceSavingThrow: 0,
		arcanaProficiency: false,
		arcana: 0,
		historyProficiency: false,
		history: 0,
		investigationProficiency: false,
		investigation: 0,
		natureProficiency: false,
		nature: 0,
		religionProficiency: false,
		religion: 0,
		wisdomModifier: 0,
		wisdomScore: 10,
		wisdomSavingThrowProficiency: false,
		wisdomSavingThrow: 0,
		animalHandlingProficiency: false,
		animalHandling: 0,
		insightProficiency: false,
		insight: 0,
		medicineProficiency: false,
		medicine: 0,
		perceptionProficiency: false,
		perception: 0,
		survivalProficiency: false,
		survival: 0,
		charismaModifier: 0,
		charismaScore: 10,
		charismaSavingThrowProficiency: false,
		charismaSavingThrow: 0,
		deceptionProficiency: false,
		deception: 0,
		intimidationProficiency: false,
		intimidation: 0,
		performanceProficiency: false,
		performance: 0,
		persuasionProficiency: false,
		persuasion: 0,
		heroicInspiration: false,
		lightArmourProficiency: false,
		mediumArmourProficiency: false,
		heavyArmourProficiency: false,
		shieldProficiency: false,
		weaponsProficiencys: '',
		toolsProficiencys: '',
		weaponsAndCantrips: Array.from({ length: WEAPON_CANTRIP_ROWS }, createEmptyWeaponCantrip),
		classFeatures1: '',
		classFeatures2: '',
		speciesTraits: '',
		feats: '',

		spellcastingAbility: '',
		spellCastingModifier: 0,
		spellSaveDC: 0,
		spellAttackBonus: 0,
		spells: Array.from({ length: SPELL_ROWS }, createEmptySpell),
		appearance: '',
		backstory: '',
		alignment: '',
		languages: '',
		equipment: '',
		magicItems: Array.from({ length: MAGIC_ITEM_ROWS }, createEmptyMagicItemAttunment),
		copperPieces: 0,
		silverPieces: 0,
		electrumPieces: 0,
		goldPieces: 0,
		platinumPieces: 0,

		spellSlots: [
			{ level: 1, current: 0, max: 0 },
			{ level: 2, current: 0, max: 0 },
			{ level: 3, current: 0, max: 0 },
			{ level: 4, current: 0, max: 0 },
			{ level: 5, current: 0, max: 0 },
			{ level: 6, current: 0, max: 0 },
			{ level: 7, current: 0, max: 0 },
			{ level: 8, current: 0, max: 0 },
			{ level: 9, current: 0, max: 0 }
		]
	};
}
