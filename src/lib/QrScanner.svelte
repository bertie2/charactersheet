<script lang="ts">
	import { ScanLine } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';
	import type QrScannerClass from 'qr-scanner';

	let {
		onScan,
		aspectRatio = $bindable(1)
	}: { onScan: (text: string) => void; aspectRatio?: number } = $props();

	let videoEl = $state<HTMLVideoElement | undefined>(undefined);
	let error = $state<string | null>(null);
	let ready = $state(false);
	let scanning = $state(false);
	let scanMessage = $state<string | null>(null);
	let scanner: QrScannerClass | undefined;

	/**
	 * Keep the viewport aimable: match the camera's native ratio but never let it
	 * stretch to a wide 16:9 letterbox (clamped between square and 4:3).
	 */
	function updateAspect() {
		const v = videoEl;
		if (!v || !v.videoWidth || !v.videoHeight) return;
		const ratio = v.videoWidth / v.videoHeight;
		aspectRatio = Math.min(1.333, Math.max(1, ratio));
	}

	onMount(async () => {
		if (!videoEl) return;
		videoEl.addEventListener('loadedmetadata', updateAspect);
		videoEl.addEventListener('resize', updateAspect);
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
			updateAspect();
		} catch {
			error = 'Camera unavailable. Allow camera access and try again.';
		}
	});

	onDestroy(() => {
		videoEl?.removeEventListener('loadedmetadata', updateAspect);
		videoEl?.removeEventListener('resize', updateAspect);
		scanner?.destroy();
	});

	/** Decode a single frame on demand — a reliable fallback if auto-scan stalls. */
	async function manualScan() {
		if (!videoEl || scanning) return;
		scanning = true;
		scanMessage = null;
		try {
			const { default: QrScanner } = await import('qr-scanner');
			// scanImage() decodes the current video frame once (qr-scanner 1.4.x
			// has no instance-level scan() anymore).
			const result = await QrScanner.scanImage(videoEl, {
				returnDetailedScanResult: true,
				alsoTryWithoutScanRegion: true
			});
			if (result?.data) {
				onScan(result.data);
			} else {
				scanMessage = 'No QR code detected — try again.';
			}
		} catch {
			scanMessage = 'No QR code detected — try again.';
		} finally {
			scanning = false;
		}
	}
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

	{#if ready}
		{#if scanMessage}
			<div class="absolute inset-x-0 top-0 z-10 flex justify-center p-3" role="status">
				<span class="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-amber-300">
					{scanMessage}
				</span>
			</div>
		{/if}
		<div class="absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
			<button
				type="button"
				onclick={manualScan}
				disabled={scanning}
				title="Scan the QR code now"
				aria-label="Scan the QR code now"
				class="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-stone-950 shadow-lg transition hover:bg-amber-300 disabled:opacity-60"
			>
				<ScanLine class="h-4 w-4" />
				{scanning ? 'Scanning…' : 'Scan'}
			</button>
		</div>
	{/if}
</div>
