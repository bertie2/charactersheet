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

	let scanned = $state<QrChunk[]>([]);
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
		if (scanned.some((c) => c.index === chunk.index)) return; // already scanned this one
		scanned = [...scanned, chunk];
		total = chunk.total;
		if (scanned.length === total) {
			try {
				const sheet = qrsToSheet(scanned);
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
		class="absolute inset-0 cursor-default border-0 bg-black/75 p-0 backdrop-blur-sm"
		onclick={onClose}
	></button>
	<div
		class="parchment relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-sm p-5 shadow-[0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.22),0_30px_60px_-20px_rgba(0,0,0,0.95)]"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
				<ScanLine class="h-5 w-5 text-brass-600" />
				Import from QR codes
			</h2>
			<button
				onclick={onClose}
				title="Close"
				aria-label="Close"
				class="rounded-sm p-1.5 text-ink-500 transition hover:bg-ink-700/10 hover:text-ink-900"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		{#if done}
			<div class="flex flex-col items-center gap-3 py-8 text-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800/15 text-emerald-800 shadow-[inset_0_0_0_2px_rgba(6,78,59,0.25)]"
				>
					<Check class="h-7 w-7" />
				</div>
				<p class="font-display text-lg font-semibold text-ink-900">Character imported</p>
				<p class="text-sm text-ink-600">“{importedName}” has been loaded.</p>
				<button
					onclick={onClose}
					class="btn-brass mt-2 rounded-md px-5 py-2 text-sm font-semibold tracking-wide uppercase"
				>
					Done
				</button>
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-sm bg-black shadow-[0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.18)]"
				style="aspect-ratio: {camAspect};"
			>
				<QrScanner bind:aspectRatio={camAspect} onScan={handleScan} />
			</div>

			{#if error}
				<p class="mt-3 text-center text-xs font-semibold text-seal-600">{error}</p>
			{/if}

			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-ink-600">
					{#if total === 0}
						Point your camera at the first QR code
					{:else}
						<span class="font-semibold text-ink-800">{scanned.length}</span> of {total} scanned
					{/if}
				</p>
				{#if total > 0}
					<div class="flex items-center gap-1.5">
						{#each Array.from({ length: total }, (_, i) => i) as i (i)}
							<span
								class="h-2.5 w-2.5 rounded-full {scanned.some((c) => c.index === i + 1)
									? 'bg-brass-500'
									: 'bg-ink-700/25'}"
							></span>
						{/each}
					</div>
				{/if}
			</div>

			<p class="mt-4 text-center text-xs leading-relaxed text-ink-500">
				Scan the QR codes from the exporting device, one after another. The character is reassembled
				automatically once all codes are scanned. If scanning does not start automatically, tap the
				Scan button.
			</p>
		{/if}
	</div>
</div>
