import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	// Start from a clean slate so tests are isolated from each other.
	await page.goto('/');
	await page.evaluate(() => localStorage.clear());
	await page.goto('/editor');
	await page.waitForTimeout(200);
});

test('export dialog renders scannable QR codes and supports navigation', async ({ page }) => {
	// Give the character enough content to span multiple QR codes.
	await page.getByTestId('name').fill('QR Hero');
	await page.getByTestId('class').fill('Wizard');
	await page.evaluate(() => {
		const s = JSON.parse(localStorage.getItem('characterSheet') ?? '{}');
		s.weaponsAndCantrips = Array.from({ length: 18 }, (_, i) => ({
			name: `Weapon ${i}`,
			bonus: '+7',
			damage: '1d8+4',
			notes: `Longsword with a detailed note ${i}`
		}));
		s.spells = Array.from({ length: 45 }, (_, i) => ({
			level: i % 10,
			name: `Spell ${i}`,
			castingTime: '1 action',
			range: '60 ft',
			concentration: false,
			ritual: false,
			material: false,
			notes: `A fairly long note describing spell ${i} in detail`
		}));
		s.backstory = 'A long backstory that keeps going on and on. '.repeat(30);
		s.equipment = 'Sword, shield, rope, lantern, potions, backpack. '.repeat(25);
		localStorage.setItem('characterSheet', JSON.stringify(s));
	});
	await page.reload();
	await page.waitForTimeout(400);

	await page.locator('header button[title="Export as QR codes"]').click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByText(/QR 1 of \d+/)).toBeVisible();

	// The QR canvas must have actually drawn something.
	const canvas = page.locator('[role="dialog"] canvas');
	await expect(canvas).toBeVisible();
	const dataLen = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL().length);
	expect(dataLen).toBeGreaterThan(2000);

	// Navigate to the next code.
	await page.locator('[role="dialog"] button[title="Next QR code"]').click();
	await expect(page.getByText(/QR 2 of \d+/)).toBeVisible();

	// Close.
	await page.locator('[role="dialog"] button[title="Close"]').click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('import dialog opens with a camera feed area and can be closed', async ({ page }) => {
	await page.locator('header button[title="Import from QR codes"]').click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByText('Import from QR codes')).toBeVisible();
	await expect(page.locator('[role="dialog"] video')).toBeVisible();

	await page.locator('[role="dialog"] button[title="Close"]').click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
});
