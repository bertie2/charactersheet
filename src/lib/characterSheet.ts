import { persisted } from 'svelte-persisted-store';
import { createEmptyCharacterSheet, type CharacterSheet } from './types';
import type { Writable } from 'svelte/store';

// Shared singletons so the home page and editor route stay in sync
// (each backed by the same localStorage key, but only ONE store instance).
export const characterSheet: Writable<CharacterSheet> = persisted<CharacterSheet>(
	'characterSheet',
	createEmptyCharacterSheet()
);

export const saves: Writable<Record<string, CharacterSheet>> = persisted<
	Record<string, CharacterSheet>
>('saves', {});

export function loadCharacter(name: string): boolean {
	let found = false;
	saves.update((currentSaves) => {
		const sheet = currentSaves[name];
		if (sheet) {
			characterSheet.set(structuredClone(sheet));
			found = true;
		}
		return currentSaves;
	});
	return found;
}
