<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type QrScannerClass from 'qr-scanner';

	let { onScan }: { onScan: (text: string) => void } = $props();

	let videoEl = $state<HTMLVideoElement | undefined>(undefined);
	let error = $state<string | null>(null);
	let ready = $state(false);
	let scanner: QrScannerClass | undefined;

	onMount(async () => {
		if (!videoEl) return;
		try {
			const { default: QrScanner } = await import('qr-scanner');
			// qr-scanner loads its worker via a bundled dynamic import; no WORKER_PATH needed.
			scanner = new QrScanner(
				videoEl,
				(result) => {
					const text = typeof result === 'string' ? result : result.data;
					if (text) onScan(text);
				},
				{
					highlightScanRegion: true,
					maxScansPerSecond: 10
				}
			);
			await scanner.start();
			ready = true;
		} catch {
			error = 'Camera unavailable. Allow camera access and try again.';
		}
	});

	onDestroy(() => {
		scanner?.destroy();
	});
</script>

<div class="relative h-full w-full overflow-hidden bg-black">
	<video bind:this={videoEl} muted playsinline class="block h-full w-full object-cover"></video>
	{#if error}
		<div
			class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-300"
		>
			{error}
		</div>
	{:else if !ready}
		<div class="absolute inset-0 flex items-center justify-center text-sm text-stone-400">
			Starting camera…
		</div>
	{/if}
</div>
