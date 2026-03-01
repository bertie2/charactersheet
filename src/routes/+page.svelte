<script>
	import Page1 from "$lib/Page1.svelte";
	import Page2 from "$lib/Page2.svelte";
	import { onMount } from "svelte";
    let ismobile = true;

    onMount(() => {
        const checkIsMobile = () => {
            ismobile = window.innerWidth < window.innerHeight; // Adjust the breakpoint as needed
        };

        checkIsMobile(); // Check on mount

        window.addEventListener("resize", checkIsMobile); // Listen for window resize

        return () => {
            window.removeEventListener("resize", checkIsMobile); // Clean up the event listener on unmount
        };
    })
</script>
<div class="grid {ismobile ? 'grid-cols-1' : 'grid-cols-2'} place-items-center">
    <Page1 />
    <Page2 />
</div>