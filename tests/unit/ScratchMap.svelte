<script lang="ts">
	interface Chunk {
		total: number;
		index: number;
		data: string;
	}

	let scanned = $state<Chunk[]>([]);
	let total = $state(0);

	function scan(text: string) {
		const parts = text.split('|');
		if (parts[0] !== 'CHSHEET') return;
		const t = Number(parts[1]);
		const i = Number(parts[2]);
		if (total !== 0 && t !== total) return;
		if (scanned.some((c) => c.index === i)) return;
		scanned = [...scanned, { total: t, index: i, data: parts[3] ?? '' }];
		total = t;
	}
</script>

<button onclick={() => scan('CHSHEET|2|1|aaa')}>scan 1</button>
<button onclick={() => scan('CHSHEET|2|2|bbb')}>scan 2</button>
<p data-testid="counter">{scanned.length} of {total}</p>
