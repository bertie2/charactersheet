import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScratchMap from './ScratchMap.svelte';

test('Map-based scan counter updates reactively', async () => {
	const screen = render(ScratchMap);
	await screen.getByRole('button', { name: 'scan 1' }).click();
	await expect.element(screen.getByTestId('counter')).toHaveTextContent('1 of 2');
	await screen.getByRole('button', { name: 'scan 2' }).click();
	await expect.element(screen.getByTestId('counter')).toHaveTextContent('2 of 2');
});
