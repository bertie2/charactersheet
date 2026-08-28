<script lang="ts">
	import { goto } from '$app/navigation';
	import { characterSheet, saves } from '$lib/characterSheet';
	import { createEmptyCharacterSheet } from '$lib/types';
	import {
		ArrowRight,
		BookOpen,
		Dices,
		Pencil,
		Plus,
		ScrollText,
		Swords,
		Trash2,
		Wand2
	} from '@lucide/svelte';

	function startNew() {
		characterSheet.set(createEmptyCharacterSheet());
		goto('/editor');
	}

	function continueEditing() {
		goto('/editor');
	}

	function openSaved(name: string) {
		characterSheet.set(structuredClone($saves[name]));
		goto('/editor');
	}

	function deleteSave(name: string) {
		saves.update((current) => {
			const next = { ...current };
			delete next[name];
			return next;
		});
	}

	let savedEntries = $derived(Object.entries($saves));
</script>

<main class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-14 sm:px-6">
	<div class="w-full max-w-4xl">
		<!-- ============ Hero ============ -->
		<section class="text-center">
			<div
				class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-amber-300 uppercase shadow-[0_0_24px_-6px_rgba(245,158,11,0.5)]"
			>
				<Dices class="h-4 w-4" />
				Dungeons &amp; Dragons 5e
			</div>

			<h1
				class="font-display text-5xl font-bold tracking-tight text-stone-50 sm:text-6xl md:text-7xl"
			>
				CharSheet
				<span
					class="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent"
					>Forge</span
				>
			</h1>

			<p class="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-400 sm:text-lg">
				Craft and manage your adventurer's tale. Edit official-style character sheets, track spells,
				equipment and magic items — all saved locally in your browser.
			</p>

			<!-- Primary actions -->
			<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
				<button
					onclick={startNew}
					class="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-base font-semibold text-stone-950 shadow-lg shadow-amber-500/25 transition hover:shadow-amber-400/40 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:w-auto"
				>
					<Wand2 class="h-5 w-5" />
					Create New Character
				</button>
				<button
					onclick={continueEditing}
					class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-stone-200 backdrop-blur transition hover:border-white/25 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:w-auto"
				>
					<BookOpen class="h-5 w-5" />
					Continue Editing
				</button>
			</div>
		</section>

		<!-- ============ Saved characters ============ -->
		<section class="mt-16">
			<div class="mb-5 flex items-center gap-3">
				<h2 class="text-xl font-semibold text-stone-200">Your Characters</h2>
				<div class="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent"></div>
				<span class="text-sm text-stone-500">{savedEntries.length} saved</span>
			</div>

			{#if savedEntries.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center"
				>
					<ScrollText class="mb-4 h-12 w-12 text-stone-600" />
					<p class="text-lg font-medium text-stone-300">No characters yet</p>
					<p class="mt-1 max-w-sm text-sm text-stone-500">
						Click “Create New Character” above to forge your first hero and it will appear here for
						quick access.
					</p>
				</div>
			{:else}
				<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each savedEntries as [name, sheet]}
						<li>
							<div
								class="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur transition hover:border-amber-400/40 hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.35)]"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<h3 class="truncate text-lg font-semibold text-stone-100">{name}</h3>
										<p
											class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-stone-400"
										>
											{#if sheet.class}<span class="text-amber-300/90">{sheet.class}</span>{/if}
											{#if sheet.class && sheet.species}<span class="text-stone-600">·</span>{/if}
											{#if sheet.species}<span>{sheet.species}</span>{/if}
											{#if sheet.level}<span class="text-stone-600">·</span><span
													>Lv {sheet.level}</span
												>{/if}
										</p>
									</div>
									<Swords class="h-5 w-5 shrink-0 text-amber-400/70" />
								</div>

								<div class="mt-5 flex items-center gap-2">
									<button
										onclick={() => openSaved(name)}
										class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400/90 px-3 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
									>
										<Pencil class="h-4 w-4" />
										Edit
									</button>
									<button
										onclick={() => deleteSave(name)}
										title="Delete character"
										aria-label="Delete character"
										class="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-stone-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>

				<div class="mt-6 text-center">
					<button
						onclick={startNew}
						class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-amber-300 transition hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
					>
						<Plus class="h-4 w-4" />
						Add another character
						<ArrowRight class="h-4 w-4" />
					</button>
				</div>
			{/if}
		</section>

		<footer class="mt-16 text-center text-xs text-stone-600">
			Everything is stored locally in your browser — no account, no servers.
		</footer>
	</div>
</main>

<style>
	main {
		background:
			radial-gradient(48rem 28rem at 50% -10%, rgba(217, 119, 6, 0.08), transparent 60%),
			transparent;
	}
</style>
