<script lang="ts">
	import { Maximize2, ZoomIn, ZoomOut } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { scale = $bindable(1), children }: { scale?: number; children: Snippet } = $props();

	const MAX_SCALE = 4;
	const PAN_THRESHOLD = 8; // px of movement before a touch becomes a drag
	const COMMIT_DELAY = 160; // ms of wheel silence before the zoom is committed

	let tx = $state(0);
	let ty = $state(0);
	let vw = $state(0);
	let vh = $state(0);
	// Content size at scale = 1 (normalized, so it stays constant as we zoom)
	let baseW = $state(0);
	let baseH = $state(0);

	/*
	 * `scale` is the committed layout zoom: the sheets are re-rendered at
	 * baseSize * scale, which is expensive (a few hundred container-query fields
	 * re-resolve), so it must not change per pointer event. `preview` carries the
	 * magnification a gesture has reached so far and is applied as a transform,
	 * which costs the compositor nothing. `commitZoom()` folds it back into
	 * `scale` once the gesture ends.
	 */
	let preview = $state(1);
	const effScale = $derived(scale * preview);

	let viewportEl = $state<HTMLDivElement | undefined>(undefined);
	let contentEl = $state<HTMLDivElement | undefined>(undefined);

	/*
	 * The transform is written straight to the element instead of through a
	 * binding: an interpolated `style` attribute replaces the whole attribute,
	 * which makes Blink invalidate the element's subtree on every pan frame,
	 * whereas writing the property keeps the invalidation narrow.
	 */
	$effect(() => {
		const el = contentEl;
		if (!el) return;
		el.style.transform =
			preview === 1
				? `translate(${tx}px, ${ty}px)`
				: `translate(${tx}px, ${ty}px) scale(${preview})`;
	});

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

	// Moves are coalesced onto the next frame: pointers report far faster than
	// frames, and every uncoalesced move would otherwise reach the renderer.
	let moveFrame = 0;
	let pendingX = 0;
	let pendingY = 0;
	let commitTimer: ReturnType<typeof setTimeout> | undefined;

	let showHint = $state(true);
	let hintTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		hintTimer = setTimeout(() => (showHint = false), 5000);
		return () => {
			clearTimeout(hintTimer);
			clearTimeout(commitTimer);
			if (moveFrame) cancelAnimationFrame(moveFrame);
		};
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
		const cw = baseW * effScale;
		const ch = baseH * effScale;
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
	 * Zoom to `nextScale`, keeping the content point under (px, py) fixed. The
	 * magnification is only previewed — the caller decides when to commit it.
	 */
	function zoomAt(px: number, py: number, nextScale: number) {
		if (!baseW || !baseH) return;
		nextScale = clamp(nextScale, minScaleNow(), MAX_SCALE);
		if (Math.abs(nextScale - effScale) < 0.0001) return;
		const fx = (px - tx) / (baseW * effScale); // fraction along content width
		const fy = (py - ty) / (baseH * effScale); // fraction along content height
		tx = px - fx * baseW * nextScale;
		ty = py - fy * baseH * nextScale;
		preview = nextScale / scale;
		clampT();
	}

	/**
	 * Fold the gesture preview into the real layout zoom. This is the only place
	 * that resizes the sheets, so a whole gesture costs one re-layout instead of
	 * one per pointer event. Geometry is unchanged by the switch, because
	 * scale * preview is the same magnification the transform was showing.
	 */
	function commitZoom() {
		cancelPendingCommit();
		if (preview === 1) return;
		const next = clamp(scale * preview, minScaleNow(), MAX_SCALE);
		preview = 1;
		if (Math.abs(next - scale) > 0.0001) scale = next;
		clampT();
	}

	/** Wheel bursts arrive continuously; commit once the user stops wheeling. */
	function scheduleCommit() {
		clearTimeout(commitTimer);
		commitTimer = setTimeout(commitZoom, COMMIT_DELAY);
	}

	/**
	 * A wheel gesture that has not been committed yet must not land in the middle
	 * of the next one: the re-layout it triggers is exactly the cost the preview
	 * exists to avoid.
	 */
	function cancelPendingCommit() {
		clearTimeout(commitTimer);
		commitTimer = undefined;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		dismissHint();
		const rect = viewportEl?.getBoundingClientRect();
		if (!rect) return;
		const px = e.clientX - rect.left;
		const py = e.clientY - rect.top;
		const factor = Math.exp(-e.deltaY * 0.0016);
		zoomAt(px, py, effScale * factor);
		scheduleCommit();
	}

	function beginPanCandidate(x: number, y: number) {
		cancelPendingCommit();
		panCandidate = true;
		panning = false;
		panStartX = lastX = pendingX = x;
		panStartY = lastY = pendingY = y;
	}

	function beginPinch() {
		const pts = [...touchPoints.values()];
		if (pts.length < 2) return;
		cancelPendingCommit();
		pinchStartDist = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
		pinchStartScale = effScale;
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
			cancelPendingCommit();
			panning = true;
			panCandidate = false;
			lastX = pendingX = e.clientX;
			lastY = pendingY = e.clientY;
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
				queueMove();
			} else if (panCandidate || panning) {
				pendingX = e.clientX;
				pendingY = e.clientY;
				queueMove();
			}
		} else if (e.pointerType === 'mouse' && panning) {
			pendingX = e.clientX;
			pendingY = e.clientY;
			queueMove();
		}
	}

	/**
	 * Apply at most one gesture update per frame, from the newest pointer data.
	 * Pointers report faster than frames (up to 240 Hz), and each update costs a
	 * transform plus, at commit time, a real re-layout.
	 */
	function queueMove() {
		if (moveFrame) return;
		moveFrame = requestAnimationFrame(() => {
			moveFrame = 0;
			flushMove();
		});
	}

	/** The one place that decides what a pending move should do. */
	function flushMove() {
		if (touchPoints.size >= 2 && pinching) applyPinch();
		else if (panning || panCandidate) applyPan();
	}

	function applyPinch() {
		if (!baseW || !baseH) return;
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
		preview = next / scale;
		clampT();
	}

	function applyPan() {
		const dx = pendingX - lastX;
		const dy = pendingY - lastY;
		if (!panning && Math.hypot(pendingX - panStartX, pendingY - panStartY) > PAN_THRESHOLD) {
			panning = true;
		}
		if (panning) {
			tx += dx;
			ty += dy;
			clampT();
		}
		lastX = pendingX;
		lastY = pendingY;
	}

	function onPointerUp(e: PointerEvent) {
		if (moveFrame) {
			cancelAnimationFrame(moveFrame);
			moveFrame = 0;
			// Apply the last coalesced position so a drag doesn't end a few pixels short.
			flushMove();
		}
		if (e.pointerType === 'touch') {
			touchPoints.delete(e.pointerId);
			if (pinching && touchPoints.size < 2) {
				pinching = false;
				commitZoom();
			}
			if (touchPoints.size === 1) {
				const remaining = [...touchPoints.values()][0];
				beginPanCandidate(remaining.x, remaining.y);
			} else if (touchPoints.size === 0) {
				panning = false;
				panCandidate = false;
				commitZoom();
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
		zoomAt(vw / 2, vh / 2, effScale * 1.3);
		commitZoom();
	}
	function zoomOut() {
		dismissHint();
		zoomAt(vw / 2, vh / 2, effScale / 1.3);
		commitZoom();
	}
	function resetView() {
		dismissHint();
		cancelPendingCommit();
		preview = 1;
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
	<div bind:this={contentEl} class="absolute top-0 left-0" style="transform-origin: 0 0;">
		<!-- The sheets are laid out at baseSize * committed `scale`, so text and
		     fields stay crisp. A gesture only previews its magnification with the
		     transform above and commits the new layout size when it ends. -->
		{@render children()}
	</div>

	<!-- Zoom controls -->
	<div
		class="wood absolute right-3 bottom-3 z-20 flex items-center gap-0.5 rounded-md border border-wood-900 p-1 shadow-[inset_0_1px_0_rgba(216,174,82,0.28),0_10px_22px_-10px_rgba(0,0,0,0.85)]"
	>
		<button onclick={zoomOut} title="Zoom out" aria-label="Zoom out" class="zoom-btn btn-leather">
			<ZoomOut class="h-4 w-4" />
		</button>
		<span class="min-w-11 px-1 text-center text-xs font-semibold text-parchment-200 tabular-nums"
			>{Math.round(effScale * 100)}%</span
		>
		<button onclick={zoomIn} title="Zoom in" aria-label="Zoom in" class="zoom-btn btn-leather">
			<ZoomIn class="h-4 w-4" />
		</button>
		<div class="mx-0.5 h-4 w-px bg-wood-900 shadow-[1px_0_0_rgba(216,174,82,0.18)]"></div>
		<button
			onclick={resetView}
			title="Reset view"
			aria-label="Reset view"
			class="zoom-btn btn-leather"
		>
			<Maximize2 class="h-4 w-4" />
		</button>
	</div>

	{#if showHint}
		<div
			class="parchment pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-sm px-4 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-700 shadow-[0_0_0_3px_#43290f,0_0_0_4px_rgba(216,174,82,0.22),0_12px_22px_-12px_rgba(0,0,0,0.85)]"
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

	/*
	 * Keys set into the timber rail. Sizing/layout only — the wood face, brass
	 * rim and the press-in shading come from `.btn-leather` in layout.css, which
	 * is a layer below these rules, so don't set colour or shadow here.
	 */
	.zoom-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 3px;
	}
	.zoom-btn:focus-visible {
		outline: 2px solid var(--color-brass-300);
		outline-offset: 1px;
	}
</style>
