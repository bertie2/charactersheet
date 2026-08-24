import { writable } from 'svelte/store';

export interface Viewport {
	width: number;
	height: number;
	isMobile: boolean;
}

export const viewport = writable<Viewport>({ width: 0, height: 0, isMobile: false });

/**
 * Decide whether the layout should stack vertically (mobile / portrait / narrow).
 * We treat both portrait orientation AND very narrow landscape windows as "mobile"
 * so sheets and controls never get cramped or clipped.
 */
export function isMobileViewport(width: number, height: number): boolean {
	return width < height || width < 640;
}

/** Aspect ratio (width / height) of the character sheet images. */
export const SHEET_ASPECT = 1675 / 2150; // 0.7791...
