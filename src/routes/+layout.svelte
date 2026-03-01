<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { ismobile } from '$lib/utils';

    onMount(() => {
        const checkIsMobile = () => {
            ismobile.set(window.innerWidth < window.innerHeight); // Adjust the breakpoint as needed
        };

        checkIsMobile(); // Check on mount

        window.addEventListener("resize", checkIsMobile); // Listen for window resize

        return () => {
            window.removeEventListener("resize", checkIsMobile); // Clean up the event listener on unmount
        };
    })

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
