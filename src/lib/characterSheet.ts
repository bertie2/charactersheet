import { persisted } from 'svelte-persisted-store';
import { createEmptyCharacterSheet, normalizeSheet, type CharacterSheet } from './types';
import type { Writable } from 'svelte/store';

// Shared singletons so the home page and editor route stay in sync
// (each backed by the same localStorage key, but only ONE store instance).
//
// `beforeRead` migrates what is already in localStorage: characters saved before
// the row lists were pre-populated are topped up with empty rows on the way in,
// so they open with every printed row in place and no data is rewritten.
export const characterSheet: Writable<CharacterSheet> = persisted<CharacterSheet>(
	'characterSheet',
	createEmptyCharacterSheet(),
	{ beforeRead: normalizeSheet }
);

export const saves: Writable<Record<string, CharacterSheet>> = persisted<
	Record<string, CharacterSheet>
>('saves', {});

export function loadCharacter(name: string): boolean {
	let found = false;
	saves.update((currentSaves) => {
		const sheet = currentSaves[name];
		if (sheet) {
			// Saved characters can predate the pre-populated row lists too.
			characterSheet.set(normalizeSheet(structuredClone(sheet)));
			found = true;
		}
		return currentSaves;
	});
	return found;
}
