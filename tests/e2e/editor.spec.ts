import { expect, test } from '@playwright/test';
import { gzipSync, gunzipSync } from 'fflate';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createEmptyCharacterSheet } from '../../src/lib/types';

const NAME = 'Lyra Sunshadow';
const CLASS = 'Sorcerer';
const SPECIES = 'Half-Elf';
const BACKGROUND = 'Noble';
const SUBCLASS = 'Draconic Bloodline';

// Header action buttons (title attributes are stable regardless of responsive
// label visibility).
const saveBtn = (page: import('@playwright/test').Page) =>
	page.locator('header button[title="Save to browser storage"]');
const newBtn = (page: import('@playwright/test').Page) =>
	page.locator('header button[title="New character"]');
const loadBtn = (page: import('@playwright/test').Page) =>
	page.locator('header button[title="Load a saved character"]');
const exportBtn = (page: import('@playwright/test').Page) =>
	page.locator('header button[title="Export as JSON file"]');
const importBtn = (page: import('@playwright/test').Page) =>
	page.locator('header button[title="Import from JSON file"]');

test.beforeEach(async ({ page }) => {
	// Start from a clean slate so tests are isolated from each other.
	await page.goto('/');
	await page.evaluate(() => localStorage.clear());
	await page.goto('/editor');
	// Let the app fully hydrate before interacting.
	await page.waitForTimeout(200);
});

/**
 * Headless Chromium can swallow a click on a header action button when it is
 * dispatched immediately after `.fill()`. A short pause lets the framework
 * settle, mirroring real user timing.
 */
async function settle(page: import('@playwright/test').Page) {
	await page.waitForTimeout(150);
}

test('fills in a character sheet via the UI and persists across a reload', async ({ page }) => {
	await page.getByTestId('name').fill(NAME);
	await page.getByTestId('background').fill(BACKGROUND);
	await page.getByTestId('class').fill(CLASS);
	await page.getByTestId('species').fill(SPECIES);
	await page.getByTestId('subclass').fill(SUBCLASS);
	await page.getByTestId('level').fill('5');
	await page.getByTestId('hitPoints').fill('38');
	await page.getByTestId('maxHitPoints').fill('38');
	await page.getByTestId('armourClass').fill('14');
	await page.getByTestId('strengthScore').fill('10');

	// Fields reflect what was typed.
	await expect(page.getByTestId('name')).toHaveValue(NAME);
	await expect(page.getByTestId('class')).toHaveValue(CLASS);
	await expect(page.getByTestId('level')).toHaveValue('5');

	// The sheet is persisted to localStorage, so a reload keeps the values.
	await page.reload();
	await expect(page.getByTestId('name')).toHaveValue(NAME);
	await expect(page.getByTestId('background')).toHaveValue(BACKGROUND);
	await expect(page.getByTestId('class')).toHaveValue(CLASS);
	await expect(page.getByTestId('species')).toHaveValue(SPECIES);
	await expect(page.getByTestId('subclass')).toHaveValue(SUBCLASS);
	await expect(page.getByTestId('level')).toHaveValue('5');
	await expect(page.getByTestId('armourClass')).toHaveValue('14');
	await expect(page.getByTestId('strengthScore')).toHaveValue('10');
});

test('saves a character and reloads it from the Load dropdown', async ({ page }) => {
	await page.getByTestId('name').fill(NAME);
	await page.getByTestId('class').fill(CLASS);
	await page.getByTestId('level').fill('7');

	// Save to browser storage.
	await settle(page);
	await saveBtn(page).click();
	await page.waitForTimeout(200);

	// "New" clears the sheet.
	await newBtn(page).click();
	await page.waitForTimeout(200);
	await expect(page.getByTestId('name')).toHaveValue('');
	await expect(page.getByTestId('class')).toHaveValue('');

	// Load the saved character back via the dropdown.
	await loadBtn(page).click();
	const row = page.locator('.group', { hasText: NAME });
	await expect(row).toBeVisible();
	await row.locator('button').first().click();

	await expect(page.getByTestId('name')).toHaveValue(NAME);
	await expect(page.getByTestId('class')).toHaveValue(CLASS);
	await expect(page.getByTestId('level')).toHaveValue('7');
});

test('exports a gzipped file that contains the values filled in via the UI', async ({ page }) => {
	await page.getByTestId('name').fill(NAME);
	await page.getByTestId('class').fill(CLASS);
	await page.getByTestId('level').fill('7');
	await page.getByTestId('spellSaveDC').fill('16');

	await settle(page);
	const downloadPromise = page.waitForEvent('download');
	await exportBtn(page).click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe(`${NAME}.json.gz`);

	const bytes = await fs.readFile(await download.path());
	expect(bytes[0]).toBe(0x1f);
	expect(bytes[1]).toBe(0x8b);

	const sheet = JSON.parse(new TextDecoder().decode(gunzipSync(new Uint8Array(bytes))));
	expect(sheet.name).toBe(NAME);
	expect(sheet.class).toBe(CLASS);
	expect(sheet.level).toBe(7);
	expect(sheet.spellSaveDC).toBe(16);
});

test('imports a gzipped file and populates the sheet', async ({ page }) => {
	const sheet = createEmptyCharacterSheet();
	sheet.name = 'Imported Hero';
	sheet.class = 'Cleric';
	sheet.level = 3;
	sheet.armourClass = 18;
	const gz = gzipSync(Buffer.from(JSON.stringify(sheet)));
	const tmpFile = path.join(os.tmpdir(), 'Imported Hero.json.gz');
	await fs.writeFile(tmpFile, gz);

	await settle(page);
	const fileChooserPromise = page.waitForEvent('filechooser');
	await importBtn(page).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(tmpFile);

	await expect(page.getByTestId('name')).toHaveValue('Imported Hero');
	await expect(page.getByTestId('class')).toHaveValue('Cleric');
	await expect(page.getByTestId('level')).toHaveValue('3');
	await expect(page.getByTestId('armourClass')).toHaveValue('18');
});

test('imports a legacy plain-JSON file (backward compatible)', async ({ page }) => {
	const sheet = createEmptyCharacterSheet();
	sheet.name = 'Legacy Hero';
	sheet.background = 'Hermit';
	const tmpFile = path.join(os.tmpdir(), 'legacy.json');
	await fs.writeFile(tmpFile, JSON.stringify(sheet));

	await settle(page);
	const fileChooserPromise = page.waitForEvent('filechooser');
	await importBtn(page).click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(tmpFile);

	await expect(page.getByTestId('name')).toHaveValue('Legacy Hero');
	await expect(page.getByTestId('background')).toHaveValue('Hermit');
});
