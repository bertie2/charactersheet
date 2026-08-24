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
</script>

{#if signNumber && type === 'number' && typeof value === 'number' && value > 0}
	<p
		style="position: absolute; top: {y / 10.0}cqh; left: {(x - width * 0.2) /
			10.0}cqh; width: {width / 10.0}cqh; height: {height / 10.0}cqh; font-size: {fontSize /
			10.0}cqh; line-height: {height /
			10.0}cqh; display: flex; align-items: center; justify-content: center;"
	>
		+
	</p>
{/if}
{#if type === 'checkbox'}
	<input
		type="checkbox"
		class="input sheet-checkbox"
		bind:checked
		style="position: absolute; top: {y / 10.0}cqh; left: {x / 10.0}cqh; width: {width /
			10.0}cqh; height: {height / 10.0}cqh;"
	/>
{:else if type === 'textArea'}
	<textarea
		class="input sheet-textarea"
		bind:value
		style="position: absolute; top: {y / 10.0}cqh; left: {x / 10.0}cqh; width: {width /
			10.0}cqh; height: {height / 10.0}cqh; font-size: {fontSize /
			10.0}cqh; line-height: {fontSize / 10.0}cqh;"
	></textarea>
{:else}
	<input
		{type}
		class="input sheet-field {centerText ? 'text-center' : ''}"
		bind:value
		style="position: absolute; top: {y / 10.0}cqh; left: {(signNumber &&
		type === 'number' &&
		typeof value === 'number' &&
		value > 0
			? x + width * 0.1
			: x) / 10.0}cqh; width: {width / 10.0}cqh; height: {height / 10.0}cqh; font-size: {fontSize /
			10.0}cqh; line-height: {height / 10.0}cqh;"
	/>
{/if}

<style>
	/* Shared reset for in-sheet fields */
	.input {
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		color: #1c1917;
		border-radius: 0;
		box-shadow: none;
		outline: none;
	}

	.input:focus {
		box-shadow: none;
	}

	/* Text & number fields: subtle hover, clear focus */
	.sheet-field,
	.sheet-textarea {
		caret-color: #b45309;
	}

	.sheet-field:hover,
	.sheet-textarea:hover {
		background-color: rgba(217, 119, 6, 0.08);
	}

	.sheet-field:focus,
	.sheet-textarea:focus {
		background-color: rgba(245, 158, 11, 0.14);
		box-shadow: 0 0 0 0.09cqh rgba(217, 119, 6, 0.65);
		border-radius: 0.15cqh;
	}

	textarea.sheet-textarea {
		background-color: rgba(0, 0, 0, 0.03);
		resize: none;
	}

	/* Checkboxes */
	.sheet-checkbox {
		-webkit-appearance: none;
		appearance: none;
		background-color: rgba(255, 255, 255, 0.25);
		border: 0.09cqh solid #57534e;
		border-radius: 0.18cqh;
		display: inline-block;
		cursor: pointer;
		position: absolute;
	}

	.sheet-checkbox:checked {
		background-color: #1c1917;
		border-color: #1c1917;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M1 5.5 4 8 9 2.5' fill='none' stroke='%23fbbf24' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-size: 80% 80%;
		background-position: center;
		background-repeat: no-repeat;
	}

	.sheet-checkbox:hover {
		border-color: #b45309;
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
