<script lang="ts">
	import Input from "./Input.svelte";
    import { createEmptyWeaponCantrip, type CharacterSheet } from "./types";
    import { ismobile } from "$lib/utils";
	import type { Writable } from "svelte/store";

    export let characterSheet: Writable<CharacterSheet>;

</script>
<div style="{$ismobile ? 'height: 128vw; width: 100vw;' : 'height: 100vh; width: 78vh;'} position: relative; container-type: size;">
    <img src="/page1.png" alt="Page 1" style="height: 100%; width: 100%;" />
    <!-- Char Summary -->
    <Input bind:value={$characterSheet.name} width={270} height={18} x={40} y={20} />
    <Input bind:value={$characterSheet.background} width={130} height={18} x={40} y={48} />
    <Input bind:value={$characterSheet.class} width={120} height={18} x={195} y={48} />
    <Input bind:value={$characterSheet.species} width={130} height={18} x={40} y={76} />
    <Input bind:value={$characterSheet.subsclass} width={120} height={18} x={195} y={76} />

    <!-- Level and XP -->
    <Input type={"number"} bind:value={$characterSheet.level} width={50} height={27} x={332} y={30} fontSize={20} />
    <Input type={"number"} bind:value={$characterSheet.experience} width={50} height={18} x={332} y={70} fontSize={10} />

    <!-- AC -->
    <Input type={"number"} bind:value={$characterSheet.armourClass} width={50} height={27} x={414} y={45} fontSize={20} />
    <Input type={"checkbox"} bind:checked={$characterSheet.shield} width={10} height={10} x={434} y={93} />

    <!-- Hit Points -->
    <Input type={"number"} bind:value={$characterSheet.hitPoints} width={70} height={40} x={484} y={45} fontSize={30} />
    <Input type={"number"} bind:value={$characterSheet.maxHitPoints} width={60} height={18} x={565} y={45} />
    <Input type={"number"} bind:value={$characterSheet.tempHitPoints} width={60} height={18} x={565} y={73} />

    <!-- Hit Dice -->
    <Input type={"number"} bind:value={$characterSheet.spentHitDice} width={50} height={18} x={636} y={44} />
    <Input type={"number"} bind:value={$characterSheet.maxHitDice} width={50} height={18} x={636} y={73} />

    <!-- Death Saves -->
    {#each [1, 2, 3] as i}
        <Input type={"checkbox"} checked={false} width={10} height={10} x={701 + (i-1)*14} y={53} />
    {/each}
    {#each [1, 2, 3] as i}
        <Input type={"checkbox"} checked={false} width={10} height={10} x={701 + (i-1)*14} y={81} />
    {/each}
    
    <!-- Proficiency Bonus -->
    <Input type={"number"} bind:value={$characterSheet.proficiencyBonus} width={40} height={40} x={54} y={175} fontSize={20} signNumber={true} />

    <!-- Stringth Stats -->
    <Input type={"number"} bind:value={$characterSheet.strengthModifier} width={40} height={40} x={36} y={270} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.strengthScore} width={30} height={22} x={80} y={283} />
    <Input type={"checkbox"} bind:checked={$characterSheet.strengthSavingThrowProficiency} width={10} height={10} x={23} y={338} />
    <Input type={"number"} bind:value={$characterSheet.strengthSavingThrow} width={25} height={16} x={33} y={332} signNumber={true}/>
    <Input type={"checkbox"} bind:checked={$characterSheet.athleticsProficiency} width={10} height={10} x={23} y={364} />
    <Input type={"number"} bind:value={$characterSheet.athletics} width={25} height={16} x={33} y={358} signNumber={true}/>

    <!-- Dexterity Stats -->
    <Input type={"number"} bind:value={$characterSheet.dexterityModifier} width={40} height={40} x={36} y={421} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.dexterityScore} width={30} height={22} x={80} y={435} />
    <Input type={"checkbox"} bind:checked={$characterSheet.dexteritySavingThrowProficiency} width={10} height={10} x={23} y={490} />
    <Input type={"number"} bind:value={$characterSheet.dexteritySavingThrow} width={25} height={16} x={33} y={485} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.acrobaticsProficiency} width={10} height={10} x={23} y={516} />
    <Input type={"number"} bind:value={$characterSheet.acrobatics} width={25} height={16} x={33} y={510} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.sleightOfHandProficiency} width={10} height={10} x={23} y={534} />
    <Input type={"number"} bind:value={$characterSheet.sleightOfHand} width={25} height={16} x={33} y={530} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.stealthProficiency} width={10} height={10} x={23} y={552} />
    <Input type={"number"} bind:value={$characterSheet.stealth} width={25} height={16} x={33} y={548} signNumber={true} />

    <!-- Constitution Stats -->
    <Input type={"number"} bind:value={$characterSheet.constitutionModifier} width={40} height={40} x={36} y={609} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.constitutionScore} width={30} height={22} x={80} y={624} />
    <Input type={"checkbox"} bind:checked={$characterSheet.constitutionSavingThrowProficiency} width={10} height={10} x={23} y={679} />
    <Input type={"number"} bind:value={$characterSheet.constitutionSavingThrow} width={25} height={16} x={33} y={673} signNumber={true} />
    
    <!-- Heroic Inspiration -->
    <Input type={"checkbox"} bind:checked={$characterSheet.heroicInspiration} width={10} height={10} x={70} y={760} />
    
    <!-- Equiptment Training and Proficiencies -->
    <Input type={"checkbox"} bind:checked={$characterSheet.lightArmourProficiency} width={10} height={10} x={76} y={833} />
    <Input type={"checkbox"} bind:checked={$characterSheet.mediumArmourProficiency} width={10} height={10} x={120} y={833} />
    <Input type={"checkbox"} bind:checked={$characterSheet.heavyArmourProficiency} width={10} height={10} x={178} y={833} />
    <Input type={"checkbox"} bind:checked={$characterSheet.shieldProficiency} width={10} height={10} x={226} y={833} />
    
    <Input type={"textArea"} bind:value={$characterSheet.weaponsProficiencys} width={250} height={65} x={20} y={860} fontSize={10} />
    <Input type={"textArea"} bind:value={$characterSheet.toolsProficiencys} width={250} height={42} x={20} y={938} fontSize={10} />

    <!-- Intelligence Stats -->
    <Input type={"number"} bind:value={$characterSheet.intelligenceModifier} width={40} height={40} x={174} y={170} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.intelligenceScore} width={30} height={22} x={218} y={185} />
    <Input type={"checkbox"} bind:checked={$characterSheet.intelligenceSavingThrowProficiency} width={10} height={10} x={160} y={238} />
    <Input type={"number"} bind:value={$characterSheet.intelligenceSavingThrow} width={25} height={16} x={170} y={232} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.arcanaProficiency} width={10} height={10} x={160} y={263} />
    <Input type={"number"} bind:value={$characterSheet.arcana} width={25} height={16} x={170} y={258} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.historyProficiency} width={10} height={10} x={160} y={281} />
    <Input type={"number"} bind:value={$characterSheet.history} width={25} height={16} x={170} y={275} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.investigationProficiency} width={10} height={10} x={160} y={299} />
    <Input type={"number"} bind:value={$characterSheet.investigation} width={25} height={16} x={170} y={293} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.natureProficiency} width={10} height={10} x={160} y={318} />
    <Input type={"number"} bind:value={$characterSheet.nature} width={25} height={16} x={170} y={311} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.religionProficiency} width={10} height={10} x={160} y={336} />
    <Input type={"number"} bind:value={$characterSheet.religion} width={25} height={16} x={170} y={330} signNumber={true} />
    
    <!-- Wisdom Stats -->
    <Input type={"number"} bind:value={$characterSheet.wisdomModifier} width={40} height={40} x={173} y={394} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.wisdomScore} width={30} height={22} x={218} y={409} />
    <Input type={"checkbox"} bind:checked={$characterSheet.wisdomSavingThrowProficiency} width={10} height={10} x={160} y={462} />
    <Input type={"number"} bind:value={$characterSheet.wisdomSavingThrow} width={25} height={16} x={170} y={456} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.animalHandlingProficiency} width={10} height={10} x={160} y={488} />
    <Input type={"number"} bind:value={$characterSheet.animalHandling} width={25} height={16} x={170} y={482} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.insightProficiency} width={10} height={10} x={160} y={506} />
    <Input type={"number"} bind:value={$characterSheet.insight} width={25} height={16} x={170} y={500} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.medicineProficiency} width={10} height={10} x={160} y={525} />
    <Input type={"number"} bind:value={$characterSheet.medicine} width={25} height={16} x={170} y={519} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.perceptionProficiency} width={10} height={10} x={160} y={543} />
    <Input type={"number"} bind:value={$characterSheet.perception} width={25} height={16} x={170} y={537} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.survivalProficiency} width={10} height={10} x={160} y={561} />
    <Input type={"number"} bind:value={$characterSheet.survival} width={25} height={16} x={170} y={556} signNumber={true} />

    <!-- Charisma Stats -->
    <Input type={"number"} bind:value={$characterSheet.charismaModifier} width={40} height={40} x={173} y={618} fontSize={20} signNumber={true} />
    <Input type={"number"} bind:value={$characterSheet.charismaScore} width={30} height={22} x={218} y={634} />
    <Input type={"checkbox"} bind:checked={$characterSheet.charismaSavingThrowProficiency} width={10} height={10} x={160} y={687} />
    <Input type={"number"} bind:value={$characterSheet.charismaSavingThrow} width={25} height={16} x={170} y={681} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.deceptionProficiency} width={10} height={10} x={160} y={713} />
    <Input type={"number"} bind:value={$characterSheet.deception} width={25} height={16} x={170} y={707} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.intimidationProficiency} width={10} height={10} x={160} y={731} />
    <Input type={"number"} bind:value={$characterSheet.intimidation} width={25} height={16} x={170} y={725} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.performanceProficiency} width={10} height={10} x={160} y={750} />
    <Input type={"number"} bind:value={$characterSheet.performance} width={25} height={16} x={170} y={744} signNumber={true} />
    <Input type={"checkbox"} bind:checked={$characterSheet.persuasionProficiency} width={10} height={10} x={160} y={768} />
    <Input type={"number"} bind:value={$characterSheet.persuasion} width={25} height={16} x={170} y={763} signNumber={true} />

    <!-- Initiative -->
    <Input type={"number"} bind:value={$characterSheet.initiative} width={40} height={30} x={320} y={166} fontSize={20} signNumber={true} />

    <!-- Speed -->
    <Input type={"number"} bind:value={$characterSheet.speed} width={40} height={30} x={442} y={166} fontSize={20} />

    <!-- Size -->
    <Input bind:value={$characterSheet.size} width={50} height={30} x={558} y={166} fontSize={10} centerText={true}/>

    <!-- Passive Perception -->
    <Input type={"number"} bind:value={$characterSheet.passivePerception} width={40} height={30} x={686} y={166} fontSize={20} />

    <!-- Weapons and Cantrips -->
    {#each $characterSheet.weaponsAndCantrips as weaponCantrip, index}
        <Input bind:value={$characterSheet.weaponsAndCantrips[index].name} width={133} height={18} x={295} y={255 + (index) * 25} fontSize={10} />
        <Input bind:value={$characterSheet.weaponsAndCantrips[index].bonus} width={53} height={18} x={437} y={255 + (index) * 25} fontSize={10} />
        <Input bind:value={$characterSheet.weaponsAndCantrips[index].damage} width={93} height={18} x={498} y={255 + (index) * 25} fontSize={10} />
        <Input bind:value={$characterSheet.weaponsAndCantrips[index].notes} width={155} height={18} x={599} y={255 + (index) * 25} fontSize={10} />
    {/each}
    <button style=" position: absolute; top: {25.5 + (2.495 * $characterSheet.weaponsAndCantrips.length)}cqh; left: 30cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 10cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.weaponsAndCantrips = [...$characterSheet.weaponsAndCantrips, createEmptyWeaponCantrip()]}>
        Add Weapon
    </button>
    <button style=" position: absolute; top: {25.5 + (2.495 * $characterSheet.weaponsAndCantrips.length)}cqh; left: 41cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 11cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.weaponsAndCantrips = [...$characterSheet.weaponsAndCantrips.slice(0, -1)]}>
        Remove Weapon
    </button>
    
    <!-- Class Features -->
    <Input type={"textArea"} bind:value={$characterSheet.classFeatures1} width={235} height={270} x={290} y={450} fontSize={10} />
    <Input type={"textArea"} bind:value={$characterSheet.classFeatures2} width={235} height={270} x={527} y={450} fontSize={10} />

    <!-- Species Traits -->
    <Input type={"textArea"} bind:value={$characterSheet.speciesTraits} width={220} height={220} x={290} y={763} fontSize={10} />

    <!-- Feats -->
    <Input type={"textArea"} bind:value={$characterSheet.feats} width={234} height={220} x={527} y={763} fontSize={10} />
</div>