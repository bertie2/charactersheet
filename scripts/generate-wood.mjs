#!/usr/bin/env node
/**
 * Generates `static/wood.svg` — a seamless, tileable stained-oak plank texture.
 *
 * Everything is procedural and driven by a fixed-seed PRNG, so the texture is
 * reproducible and can be re-tuned by editing the constants below and running:
 *
 *     npm run gen:wood
 *
 * What the generator paints, bottom to top:
 *   1. one base tone per board (slight per-plank variation)
 *   2. long grain lines that wander with a few low harmonics; their periods are
 *      integer fractions of the tile width, so they wrap horizontally and the
 *      tile stays seamless
 *   3. knots: neighbouring grain bows around them (flat-sawn "V" pattern) and a
 *      set of ring ellipses is drawn on top
 *   4. a dense pinstripe of hairline grain (one <path>, many subpaths — cheap)
 *   5. a per-plank sheen (lighter at the top edge, darker at the bottom) plus the
 *      seam: a dark groove, a 1px bevel highlight and a soft shade band
 *   6. a stitched noise filter for tooth; because the filter region is exactly
 *      one tile and `stitchTiles="stitch"`, the noise is seam-free too
 *
 * The tile stacks BANDS lots of PLANKS boards. Every board is generated from
 * scratch and every band is slid sideways before it is drawn, so stacking the
 * tile vertically never lines a knot or a grain line up with the one above it —
 * which is what makes a small repeating tile look like wallpaper.
 *
 * The tile is designed to be painted 1:1 (`background-size: 768px 1080px`) so the
 * grain stays crisp; each board is 72px and the tile is taller than most
 * viewports, so the vertical wrap point is rarely on screen at all.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ *
 * Geometry — keep these in sync with `--wood-tile` in layout.css
 * ------------------------------------------------------------------ */
const W = 768; // tile width, repeats horizontally
const PH = 72; // plank height
const PLANKS = 5; // boards per band
const BANDS = 4; // independently generated, sideways-shifted bands per tile
const H = PH * PLANKS * BANDS; // tile height == a whole number of boards

/* ------------------------------------------------------------------ *
 * Deterministic randomness
 * ------------------------------------------------------------------ */
function mulberry32(seed) {
	let a = seed >>> 0;
	return function random() {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const SEED = 0x5eed_0a4e;
const rand = mulberry32(SEED);
const range = (min, max) => min + rand() * (max - min);
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;
const n = (value, digits = 2) => Number(value.toFixed(digits));

/* ------------------------------------------------------------------ *
 * Palette — stained oak, warmed to sit under the candle-lit CSS overlay
 * ------------------------------------------------------------------ */
const PLANK_TONES = ['#3f2511', '#452a15', '#38200e', '#4a2c16', '#3b2310', '#402612'];

const DARK_GRAIN = (alpha) => `rgba(26,14,4,${n(alpha, 3)})`;
const LIGHT_GRAIN = (alpha) => `rgba(255,205,142,${n(alpha, 3)})`;

/* ------------------------------------------------------------------ *
 * Grain shape
 * ------------------------------------------------------------------ */
const STEP = 64; // px between grain samples (harmonics are low, this is plenty)

/** y(x) for one grain line: base offset + a few wrapping sine harmonics. */
function makeWave(yBase, harmonics) {
	return (x) =>
		harmonics.reduce((y, h) => y + h.amp * Math.sin((2 * Math.PI * h.k * x) / W + h.phase), yBase);
}

/**
 * Turns sampled points into a smooth path (quadratics through midpoints). Steps
 * are emitted relative to the previous point, which keeps a 12-segment grain
 * line down to short numbers instead of repeating absolute coordinates.
 */
function smoothPath(points) {
	let curX = points[0][0];
	let curY = points[0][1];
	let d = `M${n(curX, 1)} ${n(curY, 1)}`;

	for (let i = 1; i < points.length - 1; i++) {
		const [px, py] = points[i];
		const mx = (px + points[i + 1][0]) / 2;
		const my = (py + points[i + 1][1]) / 2;
		d += `q${n(px - curX, 1)} ${n(py - curY, 1)} ${n(mx - curX, 1)} ${n(my - curY, 1)}`;
		curX = mx;
		curY = my;
	}

	const last = points[points.length - 1];
	d += `l${n(last[0] - curX, 1)} ${n(last[1] - curY, 1)}`;
	return d;
}

/** Wraps an x position onto the tile. */
function wrapX(x) {
	return ((x % W) + W) % W;
}

/**
 * Shortest horizontal distance between two x positions on the wrapping tile, so
 * a feature sitting near one edge still steers the grain that continues at the
 * other — and stays seamless when the tile repeats.
 */
function wrapDelta(a, b) {
	return ((((a - b) % W) + W + W / 2) % W) - W / 2;
}

/* ------------------------------------------------------------------ *
 * Build the tile
 * ------------------------------------------------------------------ */
const defs = [];
const parts = [];

defs.push(
	`<linearGradient id="seamShade" x1="0" y1="0" x2="0" y2="1">` +
		`<stop offset="0" stop-color="#0b0501" stop-opacity="0.45"/>` +
		`<stop offset="1" stop-color="#0b0501" stop-opacity="0"/></linearGradient>`,
	`<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">` +
		`<stop offset="0" stop-color="#ffd79a" stop-opacity="0.07"/>` +
		`<stop offset="0.45" stop-color="#ffd79a" stop-opacity="0"/>` +
		`<stop offset="1" stop-color="#000000" stop-opacity="0.15"/></linearGradient>`,
	`<filter id="tooth" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse">` +
		`<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"/>` +
		`<feColorMatrix type="saturate" values="0"/></filter>`
);

for (let band = 0; band < BANDS; band++) {
	/*
	 * Every band is drawn from scratch and slid sideways first. The equal splits
	 * keep the knots and arcs of consecutive bands out of the same columns, and
	 * the jitter stops the stagger itself reading as a regular pattern.
	 */
	const xShift = band === 0 ? 0 : wrapX((band * W) / BANDS + range(-W / 16, W / 16));

	for (let p = 0; p < PLANKS; p++) {
		const yTop = (band * PLANKS + p) * PH;
		const clipId = `plank${band}_${p}`;
		const tone = pick(PLANK_TONES);

		// 1. the board itself (grain is clipped to it, so the board edges stay sharp)
		parts.push(`<rect x="0" y="${yTop}" width="${W}" height="${PH}" fill="${tone}"/>`);
		defs.push(
			`<clipPath id="${clipId}"><rect x="0" y="${yTop}" width="${W}" height="${PH}"/></clipPath>`
		);

		// 2. the features the grain has to flow around: round knots and the tall
		//    "cathedral" arcs that flat-sawn boards are known for
		const features = [];
		if (chance(0.55)) {
			const ry = range(3.5, 7);
			features.push({
				cx: wrapX(xShift + range(0, W)),
				cy: yTop + range(PH * 0.3, PH * 0.7),
				rx: ry * range(1.1, 1.4),
				ry,
				bow: ry * 1.5,
				sigma: ry * 0.9,
				rings: 5,
				rotation: range(-10, 10)
			});
		}
		if (chance(0.5)) {
			const rx = range(4, 7);
			const ry = range(16, 28);
			features.push({
				cx: wrapX(xShift + range(0, W)),
				cy: yTop + PH * range(0.35, 0.65),
				rx,
				ry,
				bow: rx * 2.2,
				sigma: ry * 0.85,
				rings: 4,
				rotation: range(-10, 10)
			});
		}

		/** How far a grain line at (x, yBase) is pushed away from a feature. */
		const bowAt = (x, yBase) =>
			features.reduce((sum, f) => {
				const away = Math.abs(yBase - f.cy);
				if (away > f.ry * 2.2) return sum;
				const dx = wrapDelta(x, f.cx);
				const amount =
					Math.exp(-(dx * dx) / (2 * f.sigma * f.sigma)) * Math.exp(-away / (f.ry * 1.2));
				return sum + (yBase >= f.cy ? 1 : -1) * f.bow * amount;
			}, 0);

		parts.push(`<g clip-path="url(#${clipId})">`);

		// 3. long grain lines — low harmonics whose periods divide the tile width,
		//    so the pattern still lines up after it wraps
		const lines = Math.round(PH / 4.5);
		for (let g = 0; g < lines; g++) {
			const yBase = yTop + ((g + 0.5) / lines) * PH + range(-0.9, 0.9);

			const harmonics = [];
			const count = 2 + Math.floor(rand() * 2); // 2–3 harmonics
			for (let h = 0; h < count; h++) {
				const k = 1 + Math.floor(rand() * 3); // whole periods per tile width
				harmonics.push({
					k,
					amp: range(0.5, 2.6) / (0.5 + k * 0.45),
					// the band's sideways slide is just a phase offset per harmonic
					phase: range(0, Math.PI * 2) + (2 * Math.PI * k * xShift) / W
				});
			}
			const wave = makeWave(yBase, harmonics);

			const draw = (offset) => {
				const points = [];
				for (let x = 0; x <= W; x += STEP) points.push([x, wave(x) + bowAt(x, yBase) + offset]);
				return smoothPath(points);
			};

			// a mix of faint grain, brighter figure and the occasional dark ring
			const roll = rand();
			const style =
				roll < 0.16
					? { stroke: DARK_GRAIN(range(0.32, 0.5)), width: range(1.3, 2.1) }
					: roll < 0.44
						? { stroke: LIGHT_GRAIN(range(0.06, 0.13)), width: range(0.6, 1.3) }
						: { stroke: DARK_GRAIN(range(0.14, 0.34)), width: range(0.6, 1.3) };

			parts.push(
				`<path d="${draw(0)}" stroke="${style.stroke}" stroke-width="${n(style.width, 2)}"/>`
			);

			// a close companion line makes the grain read as a band, not a hairline
			if (chance(0.35)) {
				const gap = range(1.1, 2.6);
				const dim = style.stroke.replace(/,([\d.]+)\)$/, (_, a) => `,${n(Number(a) * 0.55, 3)})`);
				parts.push(
					`<path d="${draw(gap)}" stroke="${dim}" stroke-width="${n(style.width * 0.7, 2)}"/>`
				);
			}
		}

		// 4. feature rings (knots / cathedral arcs). A feature can now sit anywhere
		//    across the width, so one that straddles the tile seam is drawn again on
		//    the far side — otherwise it would be sliced in half where the tile wraps.
		for (const f of features) {
			const reach = f.rx * f.rings + 2;
			const copies = [f.cx];
			if (f.cx - reach < 0) copies.push(f.cx + W);
			if (f.cx + reach > W) copies.push(f.cx - W);

			for (const cx of copies) {
				parts.push(
					`<g transform="translate(${n(cx, 1)} ${n(f.cy, 1)}) rotate(${n(f.rotation, 1)})">`
				);
				for (let r = 1; r <= f.rings; r++) {
					const t = r / f.rings;
					parts.push(
						`<ellipse rx="${n(f.rx * t, 2)}" ry="${n(f.ry * t, 2)}" stroke="${DARK_GRAIN(0.12 + t * 0.2)}" stroke-width="${n(0.6 + t * 0.5, 2)}"/>`
					);
				}
				parts.push(
					`<ellipse rx="${n(f.rx * 0.16, 2)}" ry="${n(f.ry * 0.16, 2)}" fill="rgba(22,11,2,0.55)"/>`
				);
				parts.push(`</g>`);
			}
		}

		// 5. hairline pinstripe — many subpaths in one <path>, so it stays cheap
		const pinstripe = [];
		for (let i = 0, count = Math.round(PH / 2); i < count; i++) {
			const y = yTop + ((i + 0.5) / count) * PH + range(-0.15, 0.15);
			pinstripe.push(`M0 ${n(y, 2)}H${W}`);
		}
		parts.push(`<path d="${pinstripe.join('')}" stroke="${DARK_GRAIN(0.08)}" stroke-width="0.5"/>`);

		parts.push(`</g>`);

		// 6. flat-sawn sheen + the seam between boards
		parts.push(`<rect x="0" y="${yTop}" width="${W}" height="${PH}" fill="url(#sheen)"/>`);
		parts.push(`<rect x="0" y="${yTop}" width="${W}" height="1.5" fill="#150b03" opacity="0.85"/>`);
		parts.push(
			`<rect x="0" y="${n(yTop + 1.5, 1)}" width="${W}" height="1" fill="#f6d69c" opacity="0.08"/>`
		);
		parts.push(`<rect x="0" y="${yTop}" width="${W}" height="14" fill="url(#seamShade)"/>`);
	}
}

// 7. tooth
parts.push(
	`<rect width="${W}" height="${H}" filter="url(#tooth)" opacity="0.2" style="mix-blend-mode:soft-light"/>`
);

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<defs>${defs.join('')}</defs>` +
	`<g fill="none" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>` +
	`</svg>\n`;

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../static/wood.svg');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);

/*
 * The CSS paints the tile at exactly these pixel dimensions, so the tokens and
 * the geometry have to agree or the grain gets squashed. Publish them here
 * instead of trusting a human to remember. Buttons use a coarser cut of the same
 * tile (`--wood-tile-btn`) so the grain still reads on a 36px face.
 */
const BTN_SCALE = 1.5;
const cssPath = resolve(here, '../src/routes/layout.css');
let css = readFileSync(cssPath, 'utf8');
const tokens = {
	'--wood-tile': `${W}px ${H}px`,
	'--wood-tile-btn': `${n(W * BTN_SCALE)}px ${n(H * BTN_SCALE)}px`
};
for (const [name, value] of Object.entries(tokens)) {
	const pattern = new RegExp(`(${name}:\\s*)[^;]+;`);
	if (!pattern.test(css)) throw new Error(`no ${name} declaration found in ${cssPath}`);
	const next = css.replace(pattern, `$1${value};`);
	if (next !== css) {
		css = next;
		console.log(`layout.css: ${name} -> ${value}`);
	}
}
writeFileSync(cssPath, css);

console.log(
	`wrote ${out} — ${W}x${H}px (${BANDS} staggered bands x ${PLANKS} boards of ${PH}px), ${(svg.length / 1024).toFixed(1)}KB`
);
