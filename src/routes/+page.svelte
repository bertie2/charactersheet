<script>
	import Menu from "$lib/Menu.svelte";
	import Page1 from "$lib/Page1.svelte";
	import Page2 from "$lib/Page2.svelte";
    import { ismobile } from "$lib/utils";
    import { persisted } from "svelte-persisted-store";
    import { createEmptyCharacterSheet } from "$lib/types";

    let characterSheet = persisted("characterSheet", createEmptyCharacterSheet());
</script>
<div class="flex {$ismobile ? 'flex-col' : 'flex-row'} place-items-center">
    <Menu {characterSheet}/>
    <Page1 {characterSheet}/>
    <Page2 {characterSheet}/>
</div>