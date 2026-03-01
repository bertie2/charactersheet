<script>
	import Page1 from "$lib/Page1.svelte";
	import Page2 from "$lib/Page2.svelte";
    import { ismobile } from "$lib/utils";
</script>
<div class="grid {$ismobile ? 'grid-cols-1' : 'grid-cols-2'} place-items-center">
    <Page1 />
    <Page2 />
</div>