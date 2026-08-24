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
		<p class="px-3 py-6 text-center text-sm text-stone-500">
			Nothing saved yet — hit <span class="text-amber-300">Save</span> to keep a character.
		</p>
	{:else}
		{#each savedEntries as [name, sheet]}
			<div class="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
				<button
					onclick={() => loadSaved(name)}
					class="flex min-w-0 flex-1 items-center gap-2 py-1 text-left focus:outline-none"
				>
					<span class="truncate text-sm font-medium text-stone-200">{name}</span>
					{#if sheet.class}
						<span class="truncate text-xs text-stone-500">{sheet.class}</span>
					{/if}
				</button>
				<button
					onclick={() => deleteSaved(name)}
					title="Delete"
					aria-label="Delete"
					class="rounded-md p-1.5 text-stone-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300 focus:opacity-100 focus:outline-none"
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

<header class="sticky top-0 z-30 border-b border-white/10 bg-stone-950/85 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-[1800px] items-center gap-2 px-3 sm:gap-3 sm:px-4">
		<!-- Brand / back to menu -->
		<a
			href="/"
			title="Back to menu"
			class="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
		>
			<Dices class="h-6 w-6 text-amber-400" />
			<span class="hidden font-display text-lg font-semibold tracking-wide text-stone-100 md:inline"
				>CharSheet</span
			>
		</a>

		<div class="h-8 w-px shrink-0 bg-white/10"></div>

		<!-- Character name -->
		<input
			bind:value={$characterSheet.name}
			type="text"
			placeholder="Character name"
			class="h-9 w-full max-w-44 min-w-0 rounded-lg border border-transparent bg-white/5 px-3 text-sm text-stone-100 placeholder-stone-500 transition focus:border-amber-400/50 focus:bg-white/10 focus:ring-2 focus:ring-amber-400/20 focus:outline-none sm:max-w-60"
		/>

		<div class="flex-1"></div>

		<!-- Desktop actions -->
		<div class="hidden items-center gap-1.5 sm:flex sm:gap-2">
			<button
				onclick={newSheet}
				title="New character"
				class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			>
				<Plus class="h-4 w-4" />
				<span class="hidden lg:inline">New</span>
			</button>

			<!-- Load dropdown (desktop) -->
			<div class="relative">
				<button
					onclick={() => (loadOpen = !loadOpen)}
					title="Load a saved character"
					class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
				>
					<FolderOpen class="h-4 w-4" />
					<span class="hidden lg:inline">Load</span>
					<ChevronDown
						class="h-3.5 w-3.5 text-stone-400 transition-transform {loadOpen ? 'rotate-180' : ''}"
					/>
				</button>

				{#if loadOpen}
					<div
						class="absolute top-full right-0 z-40 mt-2 max-h-[70vh] w-72 overflow-hidden rounded-xl border border-white/10 bg-stone-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
					>
						<div
							class="border-b border-white/10 px-4 py-2.5 text-xs font-medium tracking-wider text-stone-400 uppercase"
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
				class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 text-sm font-semibold text-stone-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:px-3"
			>
				<Save class="h-4 w-4" />
				<span class="hidden md:inline">Save</span>
			</button>

			<button
				onclick={exportSheet}
				title="Export as JSON file"
				class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			>
				<FileDown class="h-4 w-4" />
				<span class="hidden xl:inline">Export</span>
			</button>

			<button
				onclick={importSheet}
				title="Import from JSON file"
				class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			>
				<FileUp class="h-4 w-4" />
				<span class="hidden xl:inline">Import</span>
			</button>

			<button
				onclick={() => (qrExportOpen = true)}
				title="Export as QR codes"
				class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			>
				<QrCode class="h-4 w-4" />
				<span class="hidden xl:inline">QR Export</span>
			</button>

			<button
				onclick={() => (qrImportOpen = true)}
				title="Import from QR codes"
				class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
			class="relative z-40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:hidden"
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
			class="relative z-40 border-t border-white/10 bg-stone-950/95 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:hidden"
		>
			<div class="flex flex-col gap-1">
				<button
					onclick={() => {
						newSheet();
						menuOpen = false;
					}}
					class="mobile-action"
				>
					<Plus class="h-4 w-4" />
					New character
				</button>

				<button onclick={() => (loadOpen = !loadOpen)} class="mobile-action">
					<FolderOpen class="h-4 w-4" />
					Load
					<ChevronDown
						class="ml-auto h-4 w-4 text-stone-400 transition-transform {loadOpen
							? 'rotate-180'
							: ''}"
					/>
				</button>
				{#if loadOpen}
					<div class="ml-2 rounded-lg border border-white/10 bg-white/5 p-1.5">
						{@render savesList()}
					</div>
				{/if}

				<button
					onclick={() => {
						saveSheet();
						menuOpen = false;
					}}
					class="mobile-action mobile-action-primary"
				>
					<Save class="h-4 w-4" />
					Save
				</button>

				<button
					onclick={() => {
						exportSheet();
						menuOpen = false;
					}}
					class="mobile-action"
				>
					<FileDown class="h-4 w-4" />
					Export
				</button>

				<button
					onclick={() => {
						importSheet();
						menuOpen = false;
					}}
					class="mobile-action"
				>
					<FileUp class="h-4 w-4" />
					Import
				</button>

				<button
					onclick={() => {
						qrExportOpen = true;
						menuOpen = false;
					}}
					class="mobile-action"
				>
					<QrCode class="h-4 w-4" />
					QR export
				</button>

				<button
					onclick={() => {
						qrImportOpen = true;
						menuOpen = false;
					}}
					class="mobile-action"
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
		class="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/30 bg-stone-900/95 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg shadow-black/40 backdrop-blur"
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
	.mobile-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.65rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #e7e5e4;
		text-align: left;
		transition: background-color 150ms ease-out;
	}
	.mobile-action:hover {
		background-color: rgba(255, 255, 255, 0.06);
	}
	.mobile-action-primary {
		background: linear-gradient(to right, #fbbf24, #f97316);
		color: #1c1917;
		font-weight: 600;
	}
	.mobile-action-primary:hover {
		background: linear-gradient(to right, #fcd34d, #fb923c);
	}
</style>
