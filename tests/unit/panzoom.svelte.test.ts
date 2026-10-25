import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
// PanZoom positions its content with Tailwind utilities, so the component tests
// need the real stylesheet loaded the same way the app loads it.
import '../../src/routes/layout.css';
import PanZoomHarness from './PanZoomHarness.svelte';

/** Two frames: one for the coalesced pointer update, one for the style flush. */
const frames = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);

function view() {
	const root = document.querySelector<HTMLElement>('.panzoom-root');
	if (!root) throw new Error('panzoom root missing');
	const content = root.firstElementChild as HTMLElement;
	const sheet = document.querySelector<HTMLElement>('[data-testid="sheet"]');
	if (!sheet) throw new Error('sheet missing');
	return { root, content, sheet };
}

function touchPointer(el: HTMLElement, type: string, id: number, x: number, y: number): void {
	el.dispatchEvent(
		new PointerEvent(type, {
			pointerId: id,
			pointerType: 'touch',
			clientX: x,
			clientY: y,
			bubbles: true,
			cancelable: true,
			isPrimary: id === 1
		})
	);
}

test('pinching previews with a transform and re-lays the sheets out once on release', async () => {
	const screen = render(PanZoomHarness);
	await frames();
	const { root, content, sheet } = view();
	expect(sheet.style.width).toBe('600px');

	touchPointer(root, 'pointerdown', 1, 150, 300);
	touchPointer(root, 'pointerdown', 2, 250, 300);
	touchPointer(root, 'pointermove', 1, 100, 300);
	touchPointer(root, 'pointermove', 2, 300, 300);
	await frames();

	// Mid-gesture: the magnification is only a transform, the sheets keep their size.
	expect(content.style.transform).toContain('scale(2)');
	expect(sheet.style.width).toBe('600px');

	touchPointer(root, 'pointerup', 1, 100, 300);
	touchPointer(root, 'pointerup', 2, 300, 300);
	await frames();
	await frames();

	// Released: the preview is folded into the layout size and the transform resets.
	expect(content.style.transform).not.toContain('scale(');
	expect(sheet.style.width).toBe('1200px');
	await expect.element(screen.getByTestId('scale')).toHaveTextContent('2');
});

test('wheel zoom previews, then commits once the wheel stops', async () => {
	render(PanZoomHarness);
	await frames();
	const { root, content, sheet } = view();

	root.dispatchEvent(
		new WheelEvent('wheel', {
			deltaY: -140,
			clientX: 200,
			clientY: 300,
			bubbles: true,
			cancelable: true
		})
	);
	await frames();

	const preview = Number(/scale\(([\d.]+)\)/.exec(content.style.transform)?.[1]);
	expect(preview).toBeGreaterThan(1);
	expect(sheet.style.width).toBe('600px');

	await new Promise((resolve) => setTimeout(resolve, 250));
	await frames();

	expect(content.style.transform).not.toContain('scale(');
	expect(sheet.style.width).not.toBe('600px');
});

test('dragging translates without resizing the sheet', async () => {
	render(PanZoomHarness);
	await frames();
	const { root, content, sheet } = view();

	touchPointer(root, 'pointerdown', 1, 200, 300);
	touchPointer(root, 'pointermove', 1, 180, 260);
	await frames();

	expect(content.style.transform).toContain('translate(-20px, -40px)');
	expect(content.style.transform).not.toContain('scale(');
	expect(sheet.style.width).toBe('600px');
});

test('the zoom buttons commit straight away', async () => {
	const screen = render(PanZoomHarness);
	await frames();
	const { content, sheet } = view();

	await screen.getByRole('button', { name: 'Zoom in' }).click();
	await frames();

	expect(content.style.transform).not.toContain('scale(');
	expect(parseFloat(sheet.style.width)).toBeGreaterThan(600);
});

test('lifting one finger hands the gesture to panning at the committed scale', async () => {
	render(PanZoomHarness);
	await frames();
	const { root, content, sheet } = view();

	touchPointer(root, 'pointerdown', 1, 150, 300);
	touchPointer(root, 'pointerdown', 2, 250, 300);
	touchPointer(root, 'pointermove', 1, 100, 300);
	touchPointer(root, 'pointermove', 2, 300, 300);
	await frames();
	expect(content.style.transform).toContain('scale(2)');

	// Lift one finger: the preview is committed, and the survivor keeps dragging.
	touchPointer(root, 'pointerup', 1, 100, 300);
	await frames();
	expect(sheet.style.width).toBe('1200px');
	expect(content.style.transform).not.toContain('scale(');

	const before = content.style.transform;
	touchPointer(root, 'pointermove', 2, 280, 260);
	await frames();
	expect(content.style.transform).not.toBe(before);
	expect(content.style.transform).not.toContain('scale(');
	expect(sheet.style.width).toBe('1200px');

	touchPointer(root, 'pointerup', 2, 280, 260);
	await frames();
	expect(sheet.style.width).toBe('1200px');
});

test('pinching past the maximum clamps to 4x', async () => {
	const screen = render(PanZoomHarness);
	await frames();
	const { root, sheet } = view();

	touchPointer(root, 'pointerdown', 1, 190, 300);
	touchPointer(root, 'pointerdown', 2, 210, 300);
	// 20px apart -> 400px apart is a 20x pinch; MAX_SCALE is 4.
	touchPointer(root, 'pointermove', 1, 0, 300);
	touchPointer(root, 'pointermove', 2, 400, 300);
	await frames();
	touchPointer(root, 'pointerup', 1, 0, 300);
	touchPointer(root, 'pointerup', 2, 400, 300);
	await frames();
	await frames();

	expect(sheet.style.width).toBe('2400px'); // 600 * MAX_SCALE
	await expect.element(screen.getByTestId('scale')).toHaveTextContent('4');
});

test('reset cancels a pending wheel commit', async () => {
	render(PanZoomHarness);
	await frames();
	const { root, content, sheet } = view();

	root.dispatchEvent(
		new WheelEvent('wheel', {
			deltaY: -140,
			clientX: 200,
			clientY: 300,
			bubbles: true,
			cancelable: true
		})
	);
	await frames();
	expect(content.style.transform).toContain('scale(');

	await document.querySelector<HTMLElement>('button[aria-label="Reset view"]')!.click();
	await frames();
	expect(sheet.style.width).toBe('600px');

	// The wheel commit must not fire after the reset.
	await new Promise((resolve) => setTimeout(resolve, 250));
	await frames();
	expect(sheet.style.width).toBe('600px');
	expect(content.style.transform).not.toContain('scale(');
});

test('a pending wheel commit does not land in the middle of a pinch', async () => {
	render(PanZoomHarness);
	await frames();
	const { root, sheet } = view();

	root.dispatchEvent(
		new WheelEvent('wheel', {
			deltaY: -140,
			clientX: 200,
			clientY: 300,
			bubbles: true,
			cancelable: true
		})
	);
	await frames();

	touchPointer(root, 'pointerdown', 1, 150, 300);
	touchPointer(root, 'pointerdown', 2, 250, 300);
	touchPointer(root, 'pointermove', 1, 140, 300);
	touchPointer(root, 'pointermove', 2, 260, 300);
	await frames();

	// Well past COMMIT_DELAY: the pinch must not have been interrupted by a re-layout.
	await new Promise((resolve) => setTimeout(resolve, 250));
	expect(sheet.style.width).toBe('600px');

	touchPointer(root, 'pointerup', 1, 140, 300);
	touchPointer(root, 'pointerup', 2, 260, 300);
	await frames();
	await frames();
	expect(parseFloat(sheet.style.width)).toBeGreaterThan(600);
});

test('a drag that starts on a field still pans the sheet', async () => {
	render(PanZoomHarness);
	await frames();
	const { content, sheet } = view();
	const field = document.querySelector<HTMLElement>('[data-testid="field"]')!;

	// The pointerdown targets a field; the move bubbles to the pan/zoom surface.
	touchPointer(field, 'pointerdown', 1, 200, 300);
	touchPointer(field, 'pointermove', 1, 180, 260);
	await frames();

	expect(content.style.transform).toContain('translate(');
	expect(content.style.transform).not.toContain('scale(');
	expect(sheet.style.width).toBe('600px');
});
