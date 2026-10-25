<script lang="ts">
	import Menu from '$lib/Menu.svelte';
	import PanZoom from '$lib/PanZoom.svelte';
	import Page1 from '$lib/Page1.svelte';
	import Page2 from '$lib/Page2.svelte';
	import { characterSheet } from '$lib/characterSheet';
	import { SHEET_ASPECT, viewport } from '$lib/utils';

	// Chrome geometry used to compute the sheet size (px)
	// NAVBAR_H matches the rendered <header>: h-16 content + 2px bottom border.
	const NAVBAR_H = 66;
	const PAD = 20;
	const GAP = 24;

	// Zoom is owned by <PanZoom> (bound via `bind:scale`). Sheets are re-rendered
	// at baseSize * zoom so zoom is a true DOM/layout rescale — text stays crisp.
	// PanZoom only commits that scale when a gesture ends, and previews the
	// magnification with a transform in between, so pinching doesn't re-lay this
	// component out on every pointer event.
	let zoom = $state(1);
	let sheetWidth = $state(700);
	let sheetHeight = $state(900);

	$effect(() => {
		const v = $viewport;
		if (!v.width || !v.height) return;

		const availW = Math.max(240, v.width - PAD * 2);
		const availH = Math.max(240, v.height - NAVBAR_H - PAD * 2);

		let baseW: number;
		let baseH: number;
		if (v.isMobile) {
			// Stack vertically, width-limited so a full sheet fits the screen width.
			baseW = availW;
			baseH = availW / SHEET_ASPECT;
		} else {
			// Landscape: try to fit both sheets side-by-side, otherwise fall back
			// to height-limited sizing. The min() keeps sheets aligned and un-clipped
			// for any aspect ratio.
			const widthForTwo = (availW - GAP) / 2;
			const heightFromWidth = widthForTwo / SHEET_ASPECT;
			baseH = Math.min(availH, heightFromWidth);
			baseW = baseH * SHEET_ASPECT;
		}

		sheetWidth = baseW * zoom;
		sheetHeight = baseH * zoom;
	});
</script>

<div class="relative z-10 flex h-dvh flex-col">
	<Menu {characterSheet} />

	<div class="flex-1 overflow-hidden">
		<PanZoom bind:scale={zoom}>
			<!--
				Padding and gap scale with zoom, like everything else inside the
				canvas: PanZoom previews a gesture with a transform, so any fixed
				length in here would snap back to its unzoomed size when the scale
				is committed. They also keep the content's size proportional to
				`zoom`, which is what PanZoom measures its base size from.
			-->
			<div
				class="flex w-max flex-col items-center {$viewport.isMobile
					? 'flex-col'
					: 'md:flex-row md:items-start'}"
				style="padding: {PAD * zoom}px; gap: {GAP * zoom}px;"
			>
				<Page1 {characterSheet} {sheetWidth} {sheetHeight} />
				<Page2 {characterSheet} {sheetWidth} {sheetHeight} />
			</div>
		</PanZoom>
	</div>
</div>
