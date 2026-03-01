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
        name: "",
        bonus: "",
        damage: "",
        notes: ""
    }
}

export function createEmptySpell(): Spell {
    return {
        level: 0,
        name: "",
        castingTime: "",
        range: "",
        concentration: false,
        ritual: false,
        material: false,
        notes: ""
    }
}

export function createEmptyMagicItemAttunment(): MagicItemAtunment {
    return {
        attuned: false,
        name: ""
    }
}

export function createEmptyCharacterSheet(): CharacterSheet {
    return {
        name: "",
        background: "",
        class: "",
        species: "",
        subsclass: "",
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
        size: "Medium",
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
        weaponsProficiencys: "",
        toolsProficiencys: "",
        weaponsAndCantrips: [],
        classFeatures1: "",
        classFeatures2: "",
        speciesTraits: "",
        feats: "",

        spellcastingAbility: "",
        spellCastingModifier: 0,
        spellSaveDC: 0,
        spellAttackBonus: 0,
        spells: [],
        appearance: "",
        backstory: "",
        alignment: "",
        languages: "",
        equipment: "",
        magicItems: [],
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
        ],
    }
}