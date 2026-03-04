<script lang="ts">
    import { type CharacterSheet } from "./types";
    import { ismobile } from "$lib/utils";
	import type { Writable } from "svelte/store";
	import { FileDown, FileUp, Save, Folder, X, Menu } from "@lucide/svelte";
    import { persisted } from "svelte-persisted-store";

    export let saves: Writable<Record<string, CharacterSheet>> = persisted("saves", {});
    export let characterSheet: Writable<CharacterSheet>;
    let menuOpen = false;

    async function saveCharacterSheet() {
        saves.update(currentSaves => {
            return { ...currentSaves, [$characterSheet.name || "character"]: $characterSheet };
        });
    }

    async function loadCharacterSheet(name: string) {
        const savedSheet = $saves[name];
        if (savedSheet) {
            characterSheet.set(savedSheet);
        } else {
            alert("No saved character sheet found with that name.");
        }
    }

    async function exportCharacterSheet() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($characterSheet));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${$characterSheet.name || "character"}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        document.body.removeChild(downloadAnchorNode);
    }

    async function importCharacterSheet() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = e => { 
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const importedSheet = JSON.parse(event.target?.result as string);
                    characterSheet.set(importedSheet);
                } catch (error) {
                    alert("Failed to import character sheet: Invalid JSON");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

</script>
{#if menuOpen || !$ismobile}
<div class="flex-grow bg-slate-900 text-white flex flex-col p-4 gap-4" style="{$ismobile ? 'width: 100vw;' : 'height: 100vh;'}">
    {#if $ismobile}
        <button class="bg-slate-800 flex flex-row flex-grow p-2 justify-between items-center rounded-lg cursor-pointer" onclick={() => menuOpen = false}>
            <p>Close Menu</p>
            <X />
        </button>
    {/if}
    <div class="flex flex-row gap-2">
        <input type="text" bind:value={$characterSheet.name} class="bg-slate-800 rounded-lg w-full" />
        <button class="bg-slate-800 flex flex-row flex-grow p-2 gap-2 items-center rounded-lg cursor-pointer" onclick={saveCharacterSheet}>
            <p>Save</p>
            <Save />
        </button>
    </div>
    <div class="flex flex-col gap-2 flex-grow overflow-y-scroll bg-slate-800 p-2 rounded-lg" style="scrollbar-width: thin; scrollbar-color: #4a5568 transparent;">
        {#each Object.entries($saves) as [name, sheet]}
            <div class="flex flex-row gap-2 items-center bg-slate-900 p-2 rounded-lg">
                <p class="flex-grow">{name}</p>
                <button class="bg-slate-700 p-1 rounded-lg cursor-pointer flex flex-row gap-2 p-2" onclick={() => loadCharacterSheet(name)}>
                    <p>Load</p>
                    <Folder />
                </button>
            </div>
        {/each}
    </div>
    <div class="w-full flex flex-row gap-2">
        <button class="bg-slate-800 flex flex-row flex-grow p-2 justify-between items-center rounded-lg cursor-pointer" onclick={exportCharacterSheet}>
            <p>Export</p>
            <FileDown />
        </button>
        <button class="bg-slate-800 flex flex-row flex-grow p-2 justify-between items-center rounded-lg cursor-pointer" onclick={importCharacterSheet}>
            <p>Import</p>
            <FileUp />
        </button>
    </div>
</div>
{:else}
<div class="flex-grow bg-slate-900 text-white flex flex-col p-4 gap-4" style="{$ismobile ? 'width: 100vw;' : 'height: 100vh;'}">
    <button class="bg-slate-800 flex flex-row flex-grow p-2 justify-between items-center rounded-lg cursor-pointer" onclick={() => menuOpen = true}>
        <p>Open Menu</p>
        <Menu />
    </button>
</div>
{/if}