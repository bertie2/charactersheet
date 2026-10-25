<script lang="ts">
	import PanZoom from '$lib/PanZoom.svelte';

	const BASE_W = 600;
	const BASE_H = 800;

	// Sized the way `routes/editor/+page.svelte` sizes the sheets: the committed
	// zoom becomes a real layout size.
	let scale = $state(1);
</script>

<div style="height: 600px; width: 400px;">
	<PanZoom bind:scale>
		<div
			data-testid="sheet"
			style="height: {BASE_H * scale}px; width: {BASE_W * scale}px; position: relative;"
		></div>
	</PanZoom>
</div>
<p data-testid="scale">{scale}</p>
