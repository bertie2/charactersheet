<script lang="ts">
	import { Check, ScanLine, X } from '@lucide/svelte';
	import QrScanner from './QrScanner.svelte';
	import { parseQrChunk, qrsToSheet, type QrChunk } from '$lib/qrCode';
	import type { CharacterSheet } from '$lib/types';
	import type { Writable } from 'svelte/store';

	let {
		characterSheet,
		onClose,
		onImported
	}: {
		characterSheet: Writable<CharacterSheet>;
		onClose: () => void;
		onImported?: (name: string) => void;
	} = $props();

	let scanned = $state<Map<number, QrChunk>>(new Map());
	let total = $state(0);
	let done = $state(false);
	let importedName = $state('');
	let error = $state<string | null>(null);
	let camAspect = $state(1);

	function handleScan(text: string) {
		if (done) return;
		const chunk = parseQrChunk(text);
		if (!chunk) return; // ignore unrelated QR codes
		if (total !== 0 && chunk.total !== total) return;
		if (scanned.has(chunk.index)) return; // already scanned this one
		scanned.set(chunk.index, chunk);
		total = chunk.total;
		if (scanned.size === total) {
			try {
				const sheet = qrsToSheet([...scanned.values()]);
				characterSheet.set(structuredClone(sheet));
				importedName = sheet.name || 'Imported character';
				done = true;
				onImported?.(importedName);
			} catch {
				error = 'Could not reconstruct the character sheet from the scanned codes.';
			}
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		class="absolute inset-0 cursor-default border-0 bg-black/70 p-0 backdrop-blur-sm"
		onclick={onClose}
	></button>
	<div
		class="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-stone-900/95 p-5 shadow-2xl shadow-black/60"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-stone-100">
				<ScanLine class="h-5 w-5 text-amber-400" />
				Import from QR codes
			</h2>
			<button
				onclick={onClose}
				title="Close"
				aria-label="Close"
				class="rounded-lg p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		{#if done}
			<div class="flex flex-col items-center gap-3 py-8 text-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300"
				>
					<Check class="h-7 w-7" />
				</div>
				<p class="text-lg font-semibold text-stone-100">Character imported</p>
				<p class="text-sm text-stone-400">“{importedName}” has been loaded.</p>
				<button
					onclick={onClose}
					class="mt-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-semibold text-stone-950"
				>
					Done
				</button>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-xl border border-white/10 bg-black"
				style="aspect-ratio: {camAspect};"
			>
				<QrScanner bind:aspectRatio={camAspect} onScan={handleScan} />
			</div>

			{#if error}
				<p class="mt-3 text-center text-xs text-red-300">{error}</p>
			{/if}

			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-stone-400">
					{#if total === 0}
						Point your camera at the first QR code
					{:else}
						<span class="font-medium text-stone-200">{scanned.size}</span> of {total} scanned
					{/if}
				</p>
				{#if total > 0}
					<div class="flex items-center gap-1.5">
						{#each Array.from({ length: total }, (_, i) => i) as i (i)}
							<span
								class="h-2.5 w-2.5 rounded-full {scanned.has(i + 1)
									? 'bg-amber-400'
									: 'bg-white/20'}"
							></span>
						{/each}
					</div>
				{/if}
			</div>

			<p class="mt-4 text-center text-xs leading-relaxed text-stone-500">
				Scan the QR codes from the exporting device, one after another. The character is reassembled
				automatically once all codes are scanned. If scanning does not start automatically, tap the
				Scan button.
			</p>
		{/if}
	</div>
</div>
