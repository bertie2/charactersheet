<script lang="ts">
    import Input from "./Input.svelte";
    import { persisted } from "svelte-persisted-store";
    import { createEmptyCharacterSheet, createEmptySpell, createEmptyMagicItemAttunment } from "./types";
    import { ismobile } from "$lib/utils";
    export let characterSheet = persisted("characterSheet", createEmptyCharacterSheet());
</script>

<div style="{$ismobile ? 'height: 128vw; width: 100vw;' : 'height: 100vh; width: 78vh;'} position: relative; container-type: size;">
    <img src="/page2.png" alt="Page 2" style="height: 100%; width: 100%;" />

    <!-- spellcasting -->
    <Input bind:value={$characterSheet.spellcastingAbility} width={135} height={20} x={35} y={20}/>
    <Input bind:value={$characterSheet.spellCastingModifier} width={40} height={30} x={20} y={60} signNumber type="number" fontSize={20}/>
    <Input bind:value={$characterSheet.spellSaveDC} width={40} height={30} x={20} y={96} type="number" fontSize={20}/>
    <Input bind:value={$characterSheet.spellAttackBonus} width={40} height={30} x={20} y={132} signNumber type="number" fontSize={20}/>

    <!-- appearance, backstory, alignment, languages, equipment -->
    <Input type="textArea" bind:value={$characterSheet.appearance} width={232} height={95} x={530} y={40} fontSize={10} />
    <Input type="textArea" bind:value={$characterSheet.backstory} width={232} height={175} x={530} y={177} fontSize={10} />
    <Input type="text" bind:value={$characterSheet.alignment} width={232} height={20} x={530} y={370} fontSize={10} />
    <Input type="textArea" bind:value={$characterSheet.languages} width={232} height={46} x={530} y={440} fontSize={10} />   
    <Input type="textArea" bind:value={$characterSheet.equipment} width={232} height={225} x={530} y={530} fontSize={10} />

    <!-- Spells -->
    {#each $characterSheet.spells as spell, index}
        <Input type="number" bind:value={$characterSheet.spells[index].level} width={25} height={20} x={25} y={228 + index * 25.1}/>
        <Input bind:value={$characterSheet.spells[index].name} width={136} height={20} x={56} y={228 + index * 25.1}/>
        <Input bind:value={$characterSheet.spells[index].castingTime} width={37} height={20} x={200} y={228 + index * 25.1}/>
        <Input bind:value={$characterSheet.spells[index].range} width={52} height={20} x={244} y={228 + index * 25.1}/>
        <Input type="checkbox" bind:checked={$characterSheet.spells[index].concentration} width={10} height={10} x={309} y={234 + index * 25.1}/>
        <Input type="checkbox" bind:checked={$characterSheet.spells[index].ritual} width={10} height={10} x={339} y={234 + index * 25.1}/>
        <Input type="checkbox" bind:checked={$characterSheet.spells[index].material} width={10} height={10} x={366} y={234 + index * 25.1}/>
        <Input bind:value={$characterSheet.spells[index].notes} width={110} height={20} x={394} y={228 + index * 25.1}/>
    {/each}
    <button style=" position: absolute; top: {23 + (2.495 * $characterSheet.spells.length)}cqh; left: 6cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 7cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.spells = [...$characterSheet.spells, createEmptySpell()]}>
        Add Spell
    </button>
    <button style=" position: absolute; top: {23 + (2.495 * $characterSheet.spells.length)}cqh; left: 14cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 9cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.spells = [...$characterSheet.spells.slice(0, -1)]}>
        Remove Spell
    </button>

    <!-- magic item attunement -->
    {#each $characterSheet.magicItems as magicItem, index}
        <Input type="checkbox" bind:checked={$characterSheet.magicItems[index].attuned} width={10} height={10} x={543} y={774 + index * 25.1}/>
        <Input bind:value={$characterSheet.magicItems[index].name} width={195} height={18} x={560} y={770 + index * 25.1}/>
    {/each}
    <button style=" position: absolute; top: {77 + (2.495 * $characterSheet.magicItems.length)}cqh; left: 56cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 7cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.magicItems = [...$characterSheet.magicItems, createEmptyMagicItemAttunment()]}>
        Add Item
    </button>
    <button style=" position: absolute; top: {77 + (2.495 * $characterSheet.magicItems.length)}cqh; left: 64cqh; background-color: #ccc; border: none; padding: 5px 10px; cursor: pointer;
                    width: 9cqh; height: 1.6cqh; font-size: 1cqh; line-height: 1cqh;" on:click={() => $characterSheet.magicItems = [...$characterSheet.magicItems.slice(0, -1)]}>
        Remove Item
    </button>
    
    <!-- currency -->
    <Input type="number" bind:value={$characterSheet.copperPieces} width={35} height={25} x={536} y={909} fontSize={20}/>
    <Input type="number" bind:value={$characterSheet.silverPieces} width={35} height={25} x={583} y={909} fontSize={20}/>
    <Input type="number" bind:value={$characterSheet.electrumPieces} width={35} height={25} x={629} y={909} fontSize={20}/>
    <Input type="number" bind:value={$characterSheet.goldPieces} width={35} height={25} x={674} y={909} fontSize={20}/>
    <Input type="number" bind:value={$characterSheet.platinumPieces} width={35} height={25} x={720} y={909} fontSize={20}/>

    <!-- spell slots -->
    <!-- level 1 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 0}
    <Input type="number" bind:value={$characterSheet.spellSlots[0].max} width={20} height={15} x={233} y={108}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[0].current} width={49} height={15} x={257} y={108}/>
    {/if}
    <!-- level 2 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 1}
    <Input type="number" bind:value={$characterSheet.spellSlots[1].max} width={20} height={15} x={233} y={125}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[1].current} width={49} height={15} x={257} y={125}/>
    {/if}
    <!-- level 3 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 2}
    <Input type="number" bind:value={$characterSheet.spellSlots[2].max} width={20} height={15} x={233} y={143}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[2].current} width={49} height={15} x={257} y={143}/>
    {/if}
    <!-- level 4 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 3}
    <Input type="number" bind:value={$characterSheet.spellSlots[3].max} width={20} height={15} x={348} y={108}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[3].current} width={40} height={15} x={368} y={108}/>
    {/if}
    <!-- level 5 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 4}
    <Input type="number" bind:value={$characterSheet.spellSlots[4].max} width={20} height={15} x={348} y={125}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[4].current} width={40} height={15} x={368} y={125}/>
    {/if}
    <!-- level 6 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 5}
    <Input type="number" bind:value={$characterSheet.spellSlots[5].max} width={20} height={15} x={348} y={143}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[5].current} width={40} height={15} x={368} y={143}/>
    {/if}
    <!-- level 7 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 6}
    <Input type="number" bind:value={$characterSheet.spellSlots[6].max} width={20} height={15} x={450} y={108}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[6].current} width={30} height={15} x={470} y={108}/>
    {/if}
    <!-- level 8 -->
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 7}
    <Input type="number" bind:value={$characterSheet.spellSlots[7].max} width={20} height={15} x={450} y={125}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[7].current} width={30} height={15} x={470} y={125}/>
    <!-- level 9 -->
    {/if}
    {#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > 8}
    <Input type="number" bind:value={$characterSheet.spellSlots[8].max} width={20} height={15} x={450} y={143}/>
    <Input type="number" bind:value={$characterSheet.spellSlots[8].current} width={30} height={15} x={470} y={143}/>
    {/if}
</div>