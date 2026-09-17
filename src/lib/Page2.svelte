<script lang="ts">
	import Input from './Input.svelte';
	import { type CharacterSheet, createEmptySpell, createEmptyMagicItemAttunment } from './types';
	import {
		SPELL_SLOT_ROWS,
		applyExpended,
		expendedSlots,
		nextExpended,
		tickRect
	} from './spellSlots';
	import { Minus, Plus } from '@lucide/svelte';
	import type { Writable } from 'svelte/store';

	export let characterSheet: Writable<CharacterSheet>;
	export let sheetWidth: number;
	export let sheetHeight: number;

	/** Records a new expended-slot tally against a printed tick row. */
	function setExpended(levelIndex: number, expended: number) {
		characterSheet.update((sheet) => {
			const slot = sheet.spellSlots?.[levelIndex];
			if (!slot) return sheet;
			const spellSlots = sheet.spellSlots.slice();
			spellSlots[levelIndex] = applyExpended(slot, expended);
			return { ...sheet, spellSlots };
		});
	}
</script>

<div
	class="sheet-page"
	style="height: {sheetHeight}px; width: {sheetWidth}px; position: relative; container-type: size;"
>
	<img src="/page2.png" alt="Page 2" class="sheet-frame" style="height: 100%; width: 100%;" />

	<!-- spellcasting -->
	<Input
		bind:value={$characterSheet.spellcastingAbility}
		name="spellcastingAbility"
		width={135}
		height={20}
		x={35}
		y={20}
	/>
	<Input
		bind:value={$characterSheet.spellCastingModifier}
		name="spellCastingModifier"
		width={40}
		height={30}
		x={20}
		y={60}
		signNumber
		type="number"
		fontSize={20}
	/>
	<Input
		bind:value={$characterSheet.spellSaveDC}
		name="spellSaveDC"
		width={40}
		height={30}
		x={20}
		y={96}
		type="number"
		fontSize={20}
	/>
	<Input
		bind:value={$characterSheet.spellAttackBonus}
		name="spellAttackBonus"
		width={40}
		height={30}
		x={20}
		y={132}
		signNumber
		type="number"
		fontSize={20}
	/>

	<!-- appearance, backstory, alignment, languages, equipment -->
	<Input
		type="textArea"
		bind:value={$characterSheet.appearance}
		width={232}
		height={95}
		x={530}
		y={40}
		fontSize={10}
	/>
	<Input
		type="textArea"
		bind:value={$characterSheet.backstory}
		width={232}
		height={175}
		x={530}
		y={177}
		fontSize={10}
	/>
	<Input
		type="text"
		bind:value={$characterSheet.alignment}
		width={232}
		height={20}
		x={530}
		y={370}
		fontSize={10}
	/>
	<Input
		type="textArea"
		bind:value={$characterSheet.languages}
		width={232}
		height={46}
		x={530}
		y={440}
		fontSize={10}
	/>
	<Input
		type="textArea"
		bind:value={$characterSheet.equipment}
		width={232}
		height={225}
		x={530}
		y={530}
		fontSize={10}
	/>

	<!-- Spells -->
	{#each $characterSheet.spells as spell, index}
		<Input
			type="number"
			bind:value={$characterSheet.spells[index].level}
			width={25}
			height={20}
			x={25}
			y={228 + index * 25.1}
		/>
		<Input
			bind:value={$characterSheet.spells[index].name}
			width={136}
			height={20}
			x={56}
			y={228 + index * 25.1}
		/>
		<Input
			bind:value={$characterSheet.spells[index].castingTime}
			width={37}
			height={20}
			x={200}
			y={228 + index * 25.1}
		/>
		<Input
			bind:value={$characterSheet.spells[index].range}
			width={52}
			height={20}
			x={244}
			y={228 + index * 25.1}
		/>
		<Input
			type="checkbox"
			bind:checked={$characterSheet.spells[index].concentration}
			width={10}
			height={10}
			x={309}
			y={234 + index * 25.1}
		/>
		<Input
			type="checkbox"
			bind:checked={$characterSheet.spells[index].ritual}
			width={10}
			height={10}
			x={339}
			y={234 + index * 25.1}
		/>
		<Input
			type="checkbox"
			bind:checked={$characterSheet.spells[index].material}
			width={10}
			height={10}
			x={366}
			y={234 + index * 25.1}
		/>
		<Input
			bind:value={$characterSheet.spells[index].notes}
			width={110}
			height={20}
			x={394}
			y={228 + index * 25.1}
		/>
	{/each}
	<button
		class="sheet-btn sheet-btn-add"
		title="Add spell"
		aria-label="Add spell"
		style="top: {23 + 2.495 * $characterSheet.spells.length}cqh; left: 6cqh;"
		onclick={() => ($characterSheet.spells = [...$characterSheet.spells, createEmptySpell()])}
	>
		<Plus class="sheet-btn-icon" />
	</button>
	<button
		class="sheet-btn sheet-btn-remove"
		title="Remove spell"
		aria-label="Remove spell"
		style="top: {23 + 2.495 * $characterSheet.spells.length}cqh; left: 9.3cqh;"
		onclick={() => ($characterSheet.spells = [...$characterSheet.spells.slice(0, -1)])}
	>
		<Minus class="sheet-btn-icon" />
	</button>

	<!-- magic item attunement -->
	{#each $characterSheet.magicItems as magicItem, index}
		<Input
			type="checkbox"
			bind:checked={$characterSheet.magicItems[index].attuned}
			width={10}
			height={10}
			x={543}
			y={774 + index * 25.1}
		/>
		<Input
			bind:value={$characterSheet.magicItems[index].name}
			width={195}
			height={18}
			x={560}
			y={770 + index * 25.1}
		/>
	{/each}
	<button
		class="sheet-btn sheet-btn-add"
		title="Add magic item"
		aria-label="Add magic item"
		style="top: {77 + 2.495 * $characterSheet.magicItems.length}cqh; left: 56cqh;"
		onclick={() =>
			($characterSheet.magicItems = [
				...$characterSheet.magicItems,
				createEmptyMagicItemAttunment()
			])}
	>
		<Plus class="sheet-btn-icon" />
	</button>
	<button
		class="sheet-btn sheet-btn-remove"
		title="Remove magic item"
		aria-label="Remove magic item"
		style="top: {77 + 2.495 * $characterSheet.magicItems.length}cqh; left: 59.3cqh;"
		onclick={() => ($characterSheet.magicItems = [...$characterSheet.magicItems.slice(0, -1)])}
	>
		<Minus class="sheet-btn-icon" />
	</button>

	<!-- currency -->
	<Input
		type="number"
		bind:value={$characterSheet.copperPieces}
		width={35}
		height={25}
		x={536}
		y={909}
		fontSize={20}
	/>
	<Input
		type="number"
		bind:value={$characterSheet.silverPieces}
		width={35}
		height={25}
		x={583}
		y={909}
		fontSize={20}
	/>
	<Input
		type="number"
		bind:value={$characterSheet.electrumPieces}
		width={35}
		height={25}
		x={629}
		y={909}
		fontSize={20}
	/>
	<Input
		type="number"
		bind:value={$characterSheet.goldPieces}
		width={35}
		height={25}
		x={674}
		y={909}
		fontSize={20}
	/>
	<Input
		type="number"
		bind:value={$characterSheet.platinumPieces}
		width={35}
		height={25}
		x={720}
		y={909}
		fontSize={20}
	/>

	<!--
		Spell slots. The artwork prints a tally of tick targets per level (see
		`SPELL_SLOT_ROWS`): `max` is the slot total and `current` is what is left, so
		`max - current` boxes are ticked. Ticking the nth box records n expended
		slots; ticking the box that is already the last one ticked clears it.
	-->
	{#each SPELL_SLOT_ROWS as row (row.level)}
		{#if $characterSheet.spellSlots && $characterSheet.spellSlots.length > row.level}
			{@const expended = expendedSlots($characterSheet.spellSlots[row.level], row.ticks)}
			<Input
				type="number"
				bind:value={$characterSheet.spellSlots[row.level].max}
				width={row.max.width}
				height={15}
				x={row.max.x}
				y={row.max.y}
			/>
			{#each row.offsets as index (index)}
				{@const box = tickRect(row, index)}
				<Input
					type="checkbox"
					name="spellSlotTick-{row.level + 1}-{index + 1}"
					label="Level {row.level + 1} spell slot {index + 1} of {row.ticks} expended"
					checked={index < expended}
					onToggle={() => setExpended(row.level, nextExpended(expended, index))}
					x={box.x}
					y={box.y}
					width={box.width}
					height={box.height}
				/>
			{/each}
		{/if}
	{/each}
</div>
