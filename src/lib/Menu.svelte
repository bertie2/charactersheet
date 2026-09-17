<script lang="ts">
	import { goto } from '$app/navigation';
	import { loadCharacter, saves } from '$lib/characterSheet';
	import { gunzipSheet, sheetBlob } from '$lib/sheetIO';
	import QrExportDialog from './QrExportDialog.svelte';
	import QrImportDialog from './QrImportDialog.svelte';
	import { createEmptyCharacterSheet, type CharacterSheet } from './types';
	import {
		ChevronDown,
		Dices,
		FileDown,
		FileUp,
		FolderOpen,
		Menu as MenuIcon,
		Plus,
		QrCode,
		Save,
		ScanLine,
		Trash2,
		X
	} from '@lucide/svelte';
	import type { Writable } from 'svelte/store';

	let { characterSheet }: { characterSheet: Writable<CharacterSheet> } = $props();

	let loadOpen = $state(false);
	let menuOpen = $state(false);
	let qrExportOpen = $state(false);
	let qrImportOpen = $state(false);
	let savedFlash = $state<string | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	function showFlash(message: string) {
		savedFlash = message;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (savedFlash = null), 2200);
	}

	function saveSheet() {
		const key = $characterSheet.name?.trim() || 'Unnamed Character';
		saves.update((current) => ({ ...current, [key]: structuredClone($characterSheet) }));
		loadOpen = false;
		showFlash(`Saved “${key}”`);
	}

	function loadSaved(name: string) {
		if (loadCharacter(name)) {
			loadOpen = false;
			menuOpen = false;
			goto('/editor');
		}
	}

	function deleteSaved(name: string) {
		saves.update((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});
	}

	function newSheet() {
		characterSheet.set(createEmptyCharacterSheet());
		showFlash('New character created');
	}

	function exportSheet() {
		const blob = sheetBlob($characterSheet);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${$characterSheet.name?.trim() || 'character'}.json.gz`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function importSheet() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,.gz,application/json,application/gzip';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const bytes = new Uint8Array(event.target?.result as ArrayBuffer);
					characterSheet.set(structuredClone(gunzipSheet(bytes)));
					showFlash('Character imported');
				} catch {
					alert('Failed to import character sheet: invalid or corrupt file');
				}
			};
			reader.readAsArrayBuffer(file);
		};
		input.click();
	}

	let savedEntries = $derived(Object.entries($saves));
</script>

{#snippet savesList()}
	{#if savedEntries.length === 0}
		<p class="px-3 py-6 text-center text-sm text-ink-600 italic">
			Nothing saved yet — hit <span class="font-semibold text-brass-600 not-italic">Save</span> to keep
			a character.
		</p>
	{:else}
		{#each savedEntries as [name, sheet]}
			<div
				class="group flex items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 transition hover:border-ink-400/40 hover:bg-white/50"
			>
				<button
					onclick={() => loadSaved(name)}
					class="flex min-w-0 flex-1 items-center gap-2 py-1 text-left focus:outline-none"
				>
					<span class="truncate text-sm font-semibold text-ink-800">{name}</span>
					{#if sheet.class}
						<span class="truncate text-xs text-ink-500">{sheet.class}</span>
					{/if}
				</button>
				<button
					onclick={() => deleteSaved(name)}
					title="Delete"
					aria-label="Delete"
					class="rounded-sm p-1.5 text-ink-500 opacity-0 transition group-hover:opacity-100 hover:bg-seal-500/15 hover:text-seal-600 focus:opacity-100 focus:outline-none"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		{/each}
	{/if}
{/snippet}

<!-- Click-away backdrops (kept outside <header> so backdrop-filter can't
     constrain their fixed positioning to the header's box) -->
{#if menuOpen}
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		class="fixed inset-0 z-20 cursor-default border-0 bg-transparent p-0 sm:hidden"
		onclick={() => (menuOpen = false)}
	></button>
{/if}
{#if loadOpen}
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		class="fixed inset-0 z-20 hidden cursor-default border-0 bg-transparent p-0 sm:block"
		onclick={() => (loadOpen = false)}
	></button>
{/if}

<header
	class="wood sticky top-0 z-30 border-b-2 border-wood-900 shadow-[inset_0_-1px_0_rgba(216,174,82,0.3),0_12px_26px_-16px_rgba(0,0,0,0.95)]"
>
	<div class="mx-auto flex h-16 max-w-[1800px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
		<!-- Brand / back to menu -->
		<a
			href="/"
			title="Back to menu"
			class="flex shrink-0 items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 transition hover:border-brass-500/35 hover:bg-wood-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/70"
		>
			<Dices class="h-6 w-6 text-brass-300" />
			<span
				class="hidden font-display text-lg font-semibold tracking-[0.14em] text-parchment-100 drop-shadow-[0_1px_0_rgba(0,0,0,0.7)] md:inline"
				>CharSheet</span
			>
		</a>

		<div class="h-8 w-px shrink-0 bg-wood-900/80 shadow-[1px_0_0_rgba(216,174,82,0.18)]"></div>

		<!-- Character name -->
		<input
			bind:value={$characterSheet.name}
			type="text"
			placeholder="Character name"
			class="field-carved h-9 w-full max-w-44 min-w-0 rounded-sm px-3 text-sm font-semibold tracking-wide sm:max-w-60"
		/>

		<div class="flex-1"></div>

		<!-- Desktop actions -->
		<div class="hidden items-center gap-1.5 sm:flex sm:gap-2">
			<button
				onclick={newSheet}
				title="New character"
				class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
			>
				<Plus class="h-4 w-4" />
				<span class="hidden lg:inline">New</span>
			</button>

			<!-- Load dropdown (desktop) -->
			<div class="relative">
				<button
					onclick={() => (loadOpen = !loadOpen)}
					title="Load a saved character"
					class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
				>
					<FolderOpen class="h-4 w-4" />
					<span class="hidden lg:inline">Load</span>
					<ChevronDown
						class="h-3.5 w-3.5 text-parchment-300 transition-transform {loadOpen
							? 'rotate-180'
							: ''}"
					/>
				</button>

				{#if loadOpen}
					<div
						class="parchment absolute top-full right-0 z-40 mt-3 max-h-[70vh] w-72 overflow-hidden rounded-sm shadow-[inset_0_0_30px_rgba(133,92,42,0.2),0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.22),0_24px_40px_-16px_rgba(0,0,0,0.9)]"
					>
						<div
							class="border-b-2 border-ink-400/30 px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.18em] text-ink-600 uppercase"
						>
							Saved characters
						</div>
						<div class="max-h-64 overflow-y-auto p-1.5">{@render savesList()}</div>
					</div>
				{/if}
			</div>

			<button
				onclick={saveSheet}
				title="Save to browser storage"
				class="btn-brass inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold sm:px-3"
			>
				<Save class="h-4 w-4" />
				<span class="hidden md:inline">Save</span>
			</button>

			<button
				onclick={exportSheet}
				title="Export as JSON file"
				class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
			>
				<FileDown class="h-4 w-4" />
				<span class="hidden xl:inline">Export</span>
			</button>

			<button
				onclick={importSheet}
				title="Import from JSON file"
				class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
			>
				<FileUp class="h-4 w-4" />
				<span class="hidden xl:inline">Import</span>
			</button>

			<button
				onclick={() => (qrExportOpen = true)}
				title="Export as QR codes"
				class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
			>
				<QrCode class="h-4 w-4" />
				<span class="hidden xl:inline">QR Export</span>
			</button>

			<button
				onclick={() => (qrImportOpen = true)}
				title="Import from QR codes"
				class="btn-leather inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
			>
				<ScanLine class="h-4 w-4" />
				<span class="hidden xl:inline">QR Import</span>
			</button>
		</div>

		<!-- Mobile menu toggle -->
		<button
			onclick={() => (menuOpen = !menuOpen)}
			title="Menu"
			aria-label="Menu"
			aria-expanded={menuOpen}
			class="btn-leather relative z-40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md sm:hidden"
		>
			{#if menuOpen}
				<X class="h-5 w-5" />
			{:else}
				<MenuIcon class="h-5 w-5" />
			{/if}
		</button>
	</div>

	{#if menuOpen}
		<div
			class="wood relative z-40 border-t-2 border-wood-900 px-3 py-2 shadow-[0_18px_30px_-14px_rgba(0,0,0,0.85)] sm:hidden"
		>
			<div class="flex flex-col gap-1">
				<button
					onclick={() => {
						newSheet();
						menuOpen = false;
					}}
					class="mobile-action btn-leather"
				>
					<Plus class="h-4 w-4" />
					New character
				</button>

				<button onclick={() => (loadOpen = !loadOpen)} class="mobile-action btn-leather">
					<FolderOpen class="h-4 w-4" />
					Load
					<ChevronDown
						class="ml-auto h-4 w-4 text-parchment-300 transition-transform {loadOpen
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if loadOpen}
					<div class="parchment ml-2 rounded-sm p-1.5">
						{@render savesList()}
					</div>
				{/if}

				<button
					onclick={() => {
						saveSheet();
						menuOpen = false;
					}}
					class="mobile-action btn-brass"
				>
					<Save class="h-4 w-4" />
					Save
				</button>

				<button
					onclick={() => {
						exportSheet();
						menuOpen = false;
					}}
					class="mobile-action btn-leather"
				>
					<FileDown class="h-4 w-4" />
					Export
				</button>

				<button
					onclick={() => {
						importSheet();
						menuOpen = false;
					}}
					class="mobile-action btn-leather"
				>
					<FileUp class="h-4 w-4" />
					Import
				</button>

				<button
					onclick={() => {
						qrExportOpen = true;
						menuOpen = false;
					}}
					class="mobile-action btn-leather"
				>
					<QrCode class="h-4 w-4" />
					QR export
				</button>

				<button
					onclick={() => {
						qrImportOpen = true;
						menuOpen = false;
					}}
					class="mobile-action btn-leather"
				>
					<ScanLine class="h-4 w-4" />
					QR import
				</button>
			</div>
		</div>
	{/if}
</header>

<!-- Save flash toast -->
{#if savedFlash}
	<div
		class="parchment pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-sm px-4 py-2 text-sm font-semibold text-ink-800 shadow-[0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.25),0_14px_26px_-12px_rgba(0,0,0,0.9)]"
	>
		{savedFlash}
	</div>
{/if}

<!-- QR transfer dialogs -->
{#if qrExportOpen}
	<QrExportDialog {characterSheet} onClose={() => (qrExportOpen = false)} />
{/if}
{#if qrImportOpen}
	<QrImportDialog
		{characterSheet}
		onClose={() => (qrImportOpen = false)}
		onImported={(name) => showFlash(`Imported “${name}” via QR`)}
	/>
{/if}

<style>
	/*
	 * Layout only — the wood face, brass rim, hover and press shading all come
	 * from the shared `.btn-leather` / `.btn-brass` recipe in layout.css. These
	 * rules are unlayered, so they beat that layer for the properties they set:
	 * keep colour and shadow out of here or the recipe stops applying.
	 */
	.mobile-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.65rem 0.75rem;
		border-radius: 3px;
		font-size: 0.875rem;
		text-align: left;
	}
</style>
