import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Deployed as a static/SPA app on Cloudflare Workers.
		adapter: adapter()
	}
};

export default config;
