<script lang="ts">
	import { Maximize2, ZoomIn, ZoomOut } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { scale = $bindable(1), children }: { scale?: number; children: Snippet } = $props();

	const MAX_SCALE = 4;
	const PAN_THRESHOLD = 8; // px of movement before a touch becomes a drag

	let tx = $state(0);
	let ty = $state(0);
	let vw = $state(0);
	let vh = $state(0);
	// Content size at scale = 1 (normalized, so it stays constant as we zoom)
	let baseW = $state(0);
	let baseH = $state(0);

	let viewportEl = $state<HTMLDivElement | undefined>(undefined);
	let contentEl = $state<HTMLDivElement | undefined>(undefined);

	// Pointer tracking
	const touchPoints = new Map<number, { x: number; y: number }>();
	let panning = $state(false); // actively dragging (middle mouse or touch)
	let panCandidate = $state(false); // touch is down but hasn't passed the drag threshold
	let pinching = $state(false);
	let panStartX = 0;
	let panStartY = 0;
	let lastX = 0;
	let lastY = 0;
	let pinchStartDist = 1;
	let pinchStartScale = 1;
	let pinchMidX = 0;
	let pinchMidY = 0;
	let pinchStartTx = 0;
	let pinchStartTy = 0;

	let showHint = $state(true);
	let hintTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		hintTimer = setTimeout(() => (showHint = false), 5000);
		return () => clearTimeout(hintTimer);
	});

	function clamp(v: number, lo: number, hi: number) {
		return Math.min(hi, Math.max(lo, v));
	}

	/** Smallest allowed scale so the whole sheet content can always fit on screen. */
	function minScaleNow() {
		if (!vw || !vh || !baseW || !baseH) return 1;
		return Math.min(1, vw / baseW, vh / baseH);
	}

	/** Keep the content in view, centering it whenever it is smaller than the viewport. */
	function clampT() {
		if (!vw || !vh || !baseW || !baseH) return;
		const cw = baseW * scale;
		const ch = baseH * scale;
		let minX = vw - cw;
		let maxX = 0;
		if (cw <= vw) minX = maxX = (vw - cw) / 2;
		let minY = vh - ch;
		let maxY = 0;
		if (ch <= vh) minY = maxY = (vh - ch) / 2;
		tx = clamp(tx, Math.min(minX, maxX), Math.max(minX, maxX));
		ty = clamp(ty, Math.min(minY, maxY), Math.max(minY, maxY));
	}

	/**
	 * Zoom is a true DOM/layout zoom (CSS `zoom`), so the content is re-rendered
	 * at the new size. We keep the content point under the cursor fixed while the
	 * layout size changes.
	 */
	function zoomAt(px: number, py: number, nextScale: number) {
		nextScale = clamp(nextScale, minScaleNow(), MAX_SCALE);
		if (Math.abs(nextScale - scale) < 0.0001) return;
		const fx = (px - tx) / (baseW * scale); // fraction along content width
		const fy = (py - ty) / (baseH * scale); // fraction along content height
		tx = px - fx * baseW * nextScale;
		ty = py - fy * baseH * nextScale;
		scale = nextScale;
		clampT();
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		dismissHint();
		const rect = viewportEl?.getBoundingClientRect();
		if (!rect) return;
		const px = e.clientX - rect.left;
		const py = e.clientY - rect.top;
		const factor = Math.exp(-e.deltaY * 0.0016);
		zoomAt(px, py, scale * factor);
	}

	function beginPanCandidate(x: number, y: number) {
		panCandidate = true;
		panning = false;
		panStartX = lastX = x;
		panStartY = lastY = y;
	}

	function beginPinch() {
		const pts = [...touchPoints.values()];
		if (pts.length < 2) return;
		pinchStartDist = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
		pinchStartScale = scale;
		pinchMidX = (pts[0].x + pts[1].x) / 2;
		pinchMidY = (pts[0].y + pts[1].y) / 2;
		pinchStartTx = tx;
		pinchStartTy = ty;
		panning = false;
		panCandidate = false;
		pinching = true;
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			dismissHint();
			touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (touchPoints.size >= 2) {
				beginPinch();
			} else {
				beginPanCandidate(e.clientX, e.clientY);
			}
		} else if (e.pointerType === 'mouse' && e.button === 1) {
			// Middle mouse drag to pan
			e.preventDefault();
			dismissHint();
			panning = true;
			panCandidate = false;
			lastX = e.clientX;
			lastY = e.clientY;
			try {
				viewportEl?.setPointerCapture(e.pointerId);
			} catch {
				// pointer capture can throw for synthetic/edge-case pointers; pan still works
			}
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			if (touchPoints.has(e.pointerId)) {
				touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
			}
			if (touchPoints.size >= 2 && pinching) {
				const pts = [...touchPoints.values()];
				if (pts.length < 2) return;
				const dist = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
				const midX = (pts[0].x + pts[1].x) / 2;
				const midY = (pts[0].y + pts[1].y) / 2;
				const next = clamp(pinchStartScale * (dist / pinchStartDist), minScaleNow(), MAX_SCALE);
				const fx = (pinchMidX - pinchStartTx) / (baseW * pinchStartScale);
				const fy = (pinchMidY - pinchStartTy) / (baseH * pinchStartScale);
				tx = midX - fx * baseW * next;
				ty = midY - fy * baseH * next;
				scale = next;
				clampT();
			} else if (panCandidate || panning) {
				const dx = e.clientX - lastX;
				const dy = e.clientY - lastY;
				if (!panning && Math.hypot(e.clientX - panStartX, e.clientY - panStartY) > PAN_THRESHOLD) {
					panning = true;
				}
				if (panning) {
					tx += dx;
					ty += dy;
					clampT();
				}
				lastX = e.clientX;
				lastY = e.clientY;
			}
		} else if (e.pointerType === 'mouse' && panning) {
			tx += e.clientX - lastX;
			ty += e.clientY - lastY;
			lastX = e.clientX;
			lastY = e.clientY;
			clampT();
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerType === 'touch') {
			touchPoints.delete(e.pointerId);
			if (pinching && touchPoints.size < 2) pinching = false;
			if (touchPoints.size === 1) {
				const remaining = [...touchPoints.values()][0];
				beginPanCandidate(remaining.x, remaining.y);
			} else if (touchPoints.size === 0) {
				panning = false;
				panCandidate = false;
			}
		} else if (e.pointerType === 'mouse' && panning) {
			panning = false;
		}
	}

	function wheelAction(node: HTMLElement) {
		const handler = (e: WheelEvent) => onWheel(e);
		node.addEventListener('wheel', handler, { passive: false });
		return {
			destroy() {
				node.removeEventListener('wheel', handler);
			}
		};
	}

	function dismissHint() {
		if (showHint) showHint = false;
	}

	function zoomIn() {
		dismissHint();
		zoomAt(vw / 2, vh / 2, scale * 1.3);
	}
	function zoomOut() {
		dismissHint();
		zoomAt(vw / 2, vh / 2, scale / 1.3);
	}
	function resetView() {
		dismissHint();
		scale = 1;
		tx = 0;
		ty = 0;
		clampT();
	}

	$effect(() => {
		const el = viewportEl;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			vw = el.clientWidth;
			vh = el.clientHeight;
			clampT();
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	$effect(() => {
		const el = contentEl;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			// Normalize by the current scale so baseW/baseH represent the size at scale 1.
			baseW = el.offsetWidth / scale;
			baseH = el.offsetHeight / scale;
			clampT();
		});
		ro.observe(el);
		return () => ro.disconnect();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={viewportEl}
	use:wheelAction
	role="application"
	aria-label="Zoomable character sheet area. Scroll to zoom, drag to pan."
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onmousedown={(e) => {
		if (e.button === 1) e.preventDefault();
	}}
	class="panzoom-root relative h-full w-full overflow-hidden"
	style="touch-action: none; cursor: {panning ? 'grabbing' : 'default'};"
>
	<div
		bind:this={contentEl}
		class="absolute top-0 left-0"
		style="transform: translate({tx}px, {ty}px); transform-origin: 0 0;"
	>
		<!-- Zoom is driven by the parent re-rendering the sheets at a larger layout
		     size (scale is a $bindable), so text/elements are re-laid out and stay
		     crisp — no transform scale of a composited layer. -->
		{@render children()}
	</div>

	<!-- Zoom controls -->
	<div
		class="absolute right-3 bottom-3 z-20 flex items-center gap-0.5 rounded-full border border-white/10 bg-stone-900/80 p-1 shadow-lg shadow-black/30 backdrop-blur"
	>
		<button
			onclick={zoomOut}
			title="Zoom out"
			aria-label="Zoom out"
			class="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
		>
			<ZoomOut class="h-4 w-4" />
		</button>
		<span class="min-w-11 px-1 text-center text-xs font-medium text-stone-300 tabular-nums"
			>{Math.round(scale * 100)}%</span
		>
		<button
			onclick={zoomIn}
			title="Zoom in"
			aria-label="Zoom in"
			class="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
		>
			<ZoomIn class="h-4 w-4" />
		</button>
		<div class="mx-0.5 h-4 w-px bg-white/10"></div>
		<button
			onclick={resetView}
			title="Reset view"
			aria-label="Reset view"
			class="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
		>
			<Maximize2 class="h-4 w-4" />
		</button>
	</div>

	{#if showHint}
		<div
			class="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-stone-900/80 px-4 py-1.5 text-xs whitespace-nowrap text-stone-400 backdrop-blur"
		>
			Scroll to zoom · Middle-drag or swipe to pan
		</div>
	{/if}
</div>

<style>
	.panzoom-root {
		user-select: none;
		-webkit-user-select: none;
	}
</style>
