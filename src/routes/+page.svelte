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

<main
	class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-3 py-10 sm:px-6 sm:py-14"
>
	<div class="parchment scroll-sheet w-full max-w-4xl px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
		<!-- ============ Hero ============ -->
		<section class="text-center">
			<div
				class="mx-auto mb-8 inline-flex items-center gap-2 rounded-sm border border-wood-900 bg-gradient-to-b from-wood-400 to-wood-600 px-5 py-1.5 text-[0.68rem] font-medium tracking-[0.3em] text-parchment-100 uppercase shadow-[inset_0_1px_0_rgba(255,219,165,0.25),0_3px_8px_-3px_rgba(0,0,0,0.6)]"
			>
				<Dices class="h-3.5 w-3.5 text-brass-300" />
				Dungeons &amp; Dragons 5e
			</div>

			<h1
				class="engraved font-display text-5xl font-bold tracking-tight text-ink-900 sm:text-6xl md:text-7xl"
			>
				CharSheet <span class="text-brass-600">Forge</span>
			</h1>

			<!-- Illuminated flourish -->
			<div class="mt-6 flex items-center justify-center gap-3 text-ink-400" aria-hidden="true">
				<span class="h-px w-16 bg-gradient-to-r from-transparent to-ink-400/80 sm:w-28"></span>
				<svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="currentColor">
					<path d="M12 1.5 13.9 9.2 21.5 11 13.9 12.8 12 20.5 10.1 12.8 2.5 11 10.1 9.2Z" />
				</svg>
				<span class="h-px w-16 bg-gradient-to-l from-transparent to-ink-400/80 sm:w-28"></span>
			</div>

			<p
				class="ink-dropcap mx-auto mt-7 max-w-xl text-left text-base leading-relaxed text-ink-700 sm:text-lg"
			>
				Craft and manage your adventurer's tale. Edit official-style character sheets, track spells,
				equipment and magic items — all kept safe on your own device.
			</p>

			<!-- Primary actions -->
			<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
				<button
					onclick={startNew}
					class="btn-brass inline-flex w-full items-center justify-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold tracking-wide uppercase sm:w-auto"
				>
					<Wand2 class="h-5 w-5" />
					Create New Character
				</button>
				<button
					onclick={continueEditing}
					class="btn-leather inline-flex w-full items-center justify-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold tracking-wide uppercase sm:w-auto"
				>
					<BookOpen class="h-5 w-5" />
					Continue Editing
				</button>
			</div>
		</section>

		<!-- ============ Saved characters ============ -->
		<section class="mt-14">
			<div class="mb-6 flex items-center gap-4">
				<div class="rule-heading flex-1">
					<h2 class="font-display text-lg font-semibold tracking-wide text-ink-800 uppercase">
						Your Characters
					</h2>
				</div>
				<span class="text-xs tracking-widest text-ink-500 uppercase"
					>{savedEntries.length} saved</span
				>
			</div>

			{#if savedEntries.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-ink-400/50 bg-ink-700/[0.035] px-6 py-14 text-center"
				>
					<ScrollText class="mb-4 h-12 w-12 text-ink-400" />
					<p class="font-display text-lg font-semibold text-ink-800">No characters yet</p>
					<p class="mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
						Strike “Create New Character” above to forge your first hero — they will appear here for
						quick access.
					</p>
				</div>
			{:else}
				<ul class="grid grid-cols-1 gap-5 sm:grid-cols-2">
					{#each savedEntries as [name, sheet], i}
						<li>
							<div
								class="parchment-slip group relative flex h-full rotate-[var(--tilt)] flex-col p-5 transition duration-300 hover:rotate-0"
								style="--tilt: {(i % 3) - 1}deg"
							>
								<!-- brass tack -->
								<span
									aria-hidden="true"
									class="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-brass-700 bg-gradient-to-br from-brass-100 to-brass-600 shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
								></span>

								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<h3 class="truncate font-display text-lg font-semibold text-ink-900">
											{name}
										</h3>
										<p
											class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-600"
										>
											{#if sheet.class}<span class="font-medium text-ink-700">{sheet.class}</span
												>{/if}
											{#if sheet.class && sheet.species}<span class="text-ink-400">·</span>{/if}
											{#if sheet.species}<span>{sheet.species}</span>{/if}
											{#if sheet.level}<span class="text-ink-400">·</span><span
													>Level {sheet.level}</span
												>{/if}
										</p>
									</div>
									<Swords class="h-5 w-5 shrink-0 text-ink-400" />
								</div>

								<div class="mt-5 flex items-center gap-2">
									<button
										onclick={() => openSaved(name)}
										class="btn-leather inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold"
									>
										<Pencil class="h-4 w-4" />
										Edit
									</button>
									<button
										onclick={() => deleteSave(name)}
										title="Delete character"
										aria-label="Delete character"
										class="btn-iron inline-flex items-center justify-center rounded-md p-2"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>

				<div class="mt-8 text-center">
					<button
						onclick={startNew}
						class="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold text-ink-600 underline decoration-ink-400/60 decoration-dotted underline-offset-4 transition hover:text-ink-900 hover:decoration-ink-700"
					>
						<Plus class="h-4 w-4" />
						Add another character
						<ArrowRight class="h-4 w-4" />
					</button>
				</div>
			{/if}
		</section>

		<footer
			class="mt-14 border-t border-ink-400/30 pt-5 text-center text-xs tracking-wide text-ink-500 italic"
		>
			Everything is stored locally in your browser — no account, no servers.
		</footer>
	</div>
</main>
