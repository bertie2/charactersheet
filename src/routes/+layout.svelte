<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { isMobileViewport, viewport } from '$lib/utils';

	onMount(() => {
		const updateViewport = () => {
			viewport.set({
				width: window.innerWidth,
				height: window.innerHeight,
				isMobile: isMobileViewport(window.innerWidth, window.innerHeight)
			});
		};

		updateViewport(); // Check on mount

		window.addEventListener('resize', updateViewport); // Listen for window resize

		return () => {
			window.removeEventListener('resize', updateViewport); // Clean up the event listener on unmount
		};
	});

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="app-shell min-h-dvh bg-stone-950 text-stone-100">
	<!-- ambient background glows -->
	<div class="app-glow" aria-hidden="true"></div>
	{@render children()}
</div>
