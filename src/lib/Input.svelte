<script lang="ts">
	export let type: 'text' | 'number' | 'checkbox' | 'textArea' = 'text';
	export let width: number;
	export let height: number;
	export let x: number;
	export let y: number;
	export let value: string | number = '';
	export let checked: boolean = false;
	export let fontSize: number = 10;
	export let signNumber: boolean = false;
	export let centerText: boolean = false;
	/** Optional field id — emitted as `name` + `data-testid` for styling/tests. */
	export let name: string | undefined = undefined;

	/**
	 * Field sizes arrive in the artwork's design units (1000 = sheet height) and
	 * are rendered in container units. Alegreya Sans sets ~5% narrower than the
	 * serif it replaced, so `--sheet-font-scale` buys back that height without
	 * pushing any value past the printed box it sits in — see `layout.css`.
	 */
	const sheetSize = (units: number) => `calc(${units / 10.0}cqh * var(--sheet-font-scale, 1))`;
</script>

{#if signNumber && type === 'number' && typeof value === 'number' && value > 0}
	<p
		class="sheet-sign"
		style="position: absolute; top: {y / 10.0}cqh; left: {(x - width * 0.2) /
			10.0}cqh; width: {width / 10.0}cqh; height: {height / 10.0}cqh; font-size: {sheetSize(
			fontSize
		)}; line-height: {height /
			10.0}cqh; display: flex; align-items: center; justify-content: center;"
	>
		+
	</p>
{/if}
{#if type === 'checkbox'}
	<input
		type="checkbox"
		class="input sheet-checkbox"
		{name}
		data-testid={name}
		bind:checked
		style="position: absolute; top: {y / 10.0}cqh; left: {x / 10.0}cqh; width: {width /
			10.0}cqh; height: {height / 10.0}cqh;"
	/>
{:else if type === 'textArea'}
	<textarea
		class="input sheet-textarea"
		{name}
		data-testid={name}
		bind:value
		style="position: absolute; top: {y / 10.0}cqh; left: {x / 10.0}cqh; width: {width /
			10.0}cqh; height: {height / 10.0}cqh; font-size: {sheetSize(
			fontSize
		)}; line-height: {sheetSize(fontSize)};"
	></textarea>
{:else}
	<input
		{type}
		class="input sheet-field {centerText ? 'text-center' : ''}"
		{name}
		data-testid={name}
		bind:value
		style="position: absolute; top: {y / 10.0}cqh; left: {(signNumber &&
		type === 'number' &&
		typeof value === 'number' &&
		value > 0
			? x + width * 0.1
			: x) / 10.0}cqh; width: {width / 10.0}cqh; height: {height / 10.0}cqh; font-size: {sheetSize(
			fontSize
		)}; line-height: {height / 10.0}cqh;"
	/>
{/if}

<style>
	/* Shared reset for in-sheet fields — ink on parchment */
	.input {
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		/* A low-contrast humanist sans with a tall x-height: the printed artwork
		   underneath is noisy paper, and this stays legible at ~1cqh sizes where
		   a high-contrast book serif loses its hairlines. */
		font-family: var(--font-sheet);
		font-weight: 500;
		font-variant-numeric: tabular-nums lining-nums;
		color: #2a1a0a;
		border-radius: 0;
		box-shadow: none;
		outline: none;
	}

	.input:focus {
		box-shadow: none;
	}

	/* The "+" prefix printed beside signed modifiers */
	.sheet-sign {
		margin: 0;
		font-family: var(--font-sheet);
		font-weight: 500;
		font-variant-numeric: tabular-nums lining-nums;
		color: #2a1a0a;
	}

	/* Text & number fields: a faint stain on hover, a brass-inked focus */
	.sheet-field,
	.sheet-textarea {
		caret-color: #8f6a23;
	}

	.sheet-field:hover,
	.sheet-textarea:hover {
		background-color: rgba(150, 112, 38, 0.1);
	}

	.sheet-field:focus,
	.sheet-textarea:focus {
		background-color: rgba(216, 174, 82, 0.2);
		box-shadow: 0 0 0 0.09cqh rgba(150, 112, 38, 0.8);
		border-radius: 0.15cqh;
	}

	textarea.sheet-textarea {
		background-color: rgba(120, 82, 34, 0.05);
		resize: none;
	}

	/* Checkboxes */
	.sheet-checkbox {
		-webkit-appearance: none;
		appearance: none;
		background-color: rgba(255, 255, 255, 0.45);
		border: 0.09cqh solid #7c4c27;
		border-radius: 0.18cqh;
		display: inline-block;
		cursor: pointer;
		position: absolute;
	}

	.sheet-checkbox:checked {
		background-color: #33210f;
		border-color: #241708;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M1 5.5 4 8 9 2.5' fill='none' stroke='%23e9cb7d' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-size: 80% 80%;
		background-position: center;
		background-repeat: no-repeat;
	}

	.sheet-checkbox:hover {
		border-color: #967026;
	}

	/* Hide number spinners */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
		text-align: center;
	}
</style>
