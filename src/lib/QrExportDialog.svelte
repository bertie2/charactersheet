<script lang="ts">
	import { ChevronLeft, ChevronRight, QrCode, X } from '@lucide/svelte';
	import { renderQrToCanvas, resolveChunkChars, sheetToQrChunks } from '$lib/qrCode';
	import type { CharacterSheet } from '$lib/types';
	import type { Writable } from 'svelte/store';

	let {
		characterSheet,
		onClose
	}: { characterSheet: Writable<CharacterSheet>; onClose: () => void } = $props();

	let chunks = $state<string[]>([]);
	let current = $state(0);
	let canvasEl = $state<HTMLCanvasElement | undefined>(undefined);
	let renderError = $state<string | null>(null);
	let hasRendered = $state(false);

	/** Physical (device) pixels the QR display area has available for its width. */
	function displayPx(): number {
		const dpr = window.devicePixelRatio || 1;
		const cssW = Math.max(96, canvasEl?.clientWidth ?? 280);
		return Math.round(cssW * dpr);
	}

	/** Internal canvas size: native device resolution so the QR stays crisp. */
	function renderWidth(): number {
		return Math.max(160, Math.min(2048, displayPx()));
	}

	async function rebuildChunks(keepIndex = false): Promise<void> {
		const sheet = $characterSheet;
		let next: string[];
		try {
			next = sheetToQrChunks(sheet, await resolveChunkChars(displayPx()));
		} catch {
			// Fall back to the default chunk size if the QR library fails to load.
			next = sheetToQrChunks(sheet);
		}
		chunks = next;
		if (!keepIndex) {
			current = 0;
		} else if (current >= next.length) {
			current = Math.max(0, next.length - 1);
		}
	}

	$effect(() => {
		// Re-tune the chunk size whenever the sheet changes.
		hasRendered = false;
		void rebuildChunks();
	});

	$effect(() => {
		// If the display area changes (rotation / resize), re-tune so modules stay scannable.
		const el = canvasEl;
		if (!el) return;
		let t: ReturnType<typeof setTimeout> | undefined;
		const ro = new ResizeObserver(() => {
			clearTimeout(t);
			t = setTimeout(() => void rebuildChunks(true), 200);
		});
		ro.observe(el);
		return () => {
			ro.disconnect();
			clearTimeout(t);
		};
	});

	$effect(() => {
		const c = canvasEl;
		if (!c || chunks.length === 0) return;
		renderError = null;
		renderQrToCanvas(chunks[current], c, renderWidth())
			.then(() => (hasRendered = true))
			.catch(() => (renderError = 'Failed to render the QR code.'));
	});
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
		class="parchment relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-sm p-5 shadow-[0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.22),0_30px_60px_-20px_rgba(0,0,0,0.95)] sm:max-w-xl lg:max-w-3xl"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
				<QrCode class="h-5 w-5 text-brass-600" />
				Export as QR codes
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

		<div
			class="relative flex items-center justify-center rounded-sm bg-white p-3 shadow-[0_0_0_1px_rgba(90,56,20,0.35),inset_0_0_12px_rgba(90,56,20,0.12)]"
		>
			<canvas
				bind:this={canvasEl}
				class="block h-auto w-full max-w-[280px] sm:max-w-[480px] lg:max-w-[640px]"
				style="aspect-ratio: 1 / 1;"
			></canvas>
			{#if chunks.length === 0 || !hasRendered}
				<div
					class="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-white text-sm text-ink-500"
				>
					Preparing QR codes…
				</div>
			{/if}
		</div>

		{#if chunks.length > 0 && hasRendered}
			<p class="mt-3 text-center text-sm font-semibold tracking-wide text-ink-700 tabular-nums">
				QR {current + 1} of {chunks.length}
			</p>

			<div class="mt-4 flex items-center justify-center gap-4">
				<button
					onclick={() => (current = Math.max(0, current - 1))}
					disabled={current === 0}
					title="Previous QR code"
					aria-label="Previous QR code"
					class="btn-leather inline-flex h-9 w-9 items-center justify-center rounded-sm disabled:opacity-40"
				>
					<ChevronLeft class="h-5 w-5" />
				</button>

				<div class="flex items-center gap-1.5">
					{#each chunks as chunk, i (chunk)}
						<span
							class="h-2 w-2 rounded-full transition {i === current
								? 'bg-brass-500'
								: 'bg-ink-700/25'}"
						></span>
					{/each}
				</div>

				<button
					onclick={() => (current = Math.min(chunks.length - 1, current + 1))}
					disabled={current === chunks.length - 1}
					title="Next QR code"
					aria-label="Next QR code"
					class="btn-leather inline-flex h-9 w-9 items-center justify-center rounded-sm disabled:opacity-40"
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>
		{/if}

		{#if renderError}
			<p class="mt-3 text-center text-xs font-semibold text-seal-600">{renderError}</p>
		{/if}

		<p class="mt-4 text-center text-xs leading-relaxed text-ink-500">
			On the receiving device, open the QR importer and scan each code in order to transfer this
			character without a server. Fewer, denser codes are used on high-resolution screens; smaller
			screens get more, easier-to-scan codes.
		</p>
	</div>
</div>
