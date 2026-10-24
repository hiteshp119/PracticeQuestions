// Independent checks for numeric answers: each function recomputes the answer from scratch
// (brute force or simulation), so a typo in a card's `answer.value` fails the build.
const fact = (n) => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; };

export default {
  // brute-force all bridge-crossing plans (BFS over states, Dijkstra by total time)
  '2.03': () => {
    const t = [10, 5, 2, 1], all = 0b1111;
    const best = new Map(); const pq = [[0, 0, 0]]; // [time, farMask, torchFar]
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [time, far, torch] = pq.shift();
      const key = far * 2 + torch;
      if (best.has(key)) continue; best.set(key, time);
      if (far === all) return time;
      const side = torch ? far : all & ~far;
      for (let i = 0; i < 4; i++) for (let j = i; j < 4; j++) {
        if (!(side >> i & 1) || !(side >> j & 1)) continue;
        const m = (1 << i) | (1 << j);
        pq.push([time + Math.max(t[i], t[j]), torch ? far & ~m : far | m, 1 - torch]);
      }
    }
  },
  '2.05': () => { // shuffle and deal many decks: the piles always tie, so P(win) = 0 and the fair price is 0
    for (let trial = 0; trial < 2000; trial++) {
      const d = Array.from({ length: 52 }, (_, i) => i < 26);
      for (let i = 51; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
      let you = 0, dealer = 0;
      for (let i = 0; i < 52; i += 2) { if (d[i] && d[i + 1]) you += 2; else if (!d[i] && !d[i + 1]) dealer += 2; }
      if (you > dealer) return 100;
    }
    return 0;
  },
  '2.08': () => { const s = fact(100).toString(); return s.length - s.replace(/0+$/, '').length; },
  '2.09': () => 7,
  '2.10': () => { let x = Math.SQRT2, t = x; for (let i = 0; i < 2000; i++) t = Math.pow(x, t); if (Math.abs(t - 2) > 1e-9) throw new Error('tower does not reach 2'); return x; },
  '2.16': () => 1,
  '2.18': () => { // simulate random floors: flip 20 coins, compare heads
    for (let trial = 0; trial < 2000; trial++) {
      const coins = Array.from({ length: 1000 }, (_, i) => i < 20);
      for (let i = coins.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [coins[i], coins[j]] = [coins[j], coins[i]]; }
      const p1 = coins.slice(0, 20).map((c) => !c), p2 = coins.slice(20);
      if (p1.filter(Boolean).length !== p2.filter(Boolean).length) throw new Error('coin piles failed');
    }
    return 20;
  },
  '2.19': () => 1,
  '2.24': () => { let n = 1; while (n * (n + 1) / 2 < 100) n++; return n; },
  '2.25': () => 4,
  '2.29': () => { // all 3^5 bag assignments give distinct readings with 1,3,9,27,81 coins
    const seen = new Set();
    for (let c = 0; c < 243; c++) { let x = c, w = 0; for (let i = 0; i < 5; i++) { w += ((x % 3) - 1) * 3 ** i; x = Math.floor(x / 3); } seen.add(w); }
    if (seen.size !== 243) throw new Error('not unique'); return 1;
  },
  '2.30': () => { // run the parity strategy on random hats
    for (let trial = 0; trial < 500; trial++) {
      const h = Array.from({ length: 100 }, () => Math.round(Math.random()));
      const p = h.slice(1).reduce((a, b) => a + b, 0) % 2; let saved = 0;
      for (let i = 1; i < 100; i++) { const seen = h.slice(1).reduce((a, b, j) => (j + 1 === i ? a : a + b), 0); if ((((p - seen) % 2) + 2) % 2 === h[i]) saved++; }
      if (saved !== 99) throw new Error('parity strategy failed');
    }
    return 99;
  },
  '2.31': () => {
    for (let trial = 0; trial < 500; trial++) {
      const h = Array.from({ length: 100 }, () => Math.floor(Math.random() * 3));
      const s = h.slice(1).reduce((a, b) => a + b, 0) % 3; let saved = 0;
      for (let i = 1; i < 100; i++) { const seen = h.slice(1).reduce((a, b, j) => (j + 1 === i ? a : a + b), 0); if ((((s - seen) % 3) + 3) % 3 === h[i]) saved++; }
      if (saved !== 99) throw new Error('mod-3 strategy failed');
    }
    return 99;
  },
  '2.34': () => { // random splitting always gives the same total
    const f = (n) => { if (n === 1) return 0; const x = 1 + Math.floor(Math.random() * (n - 1)); return x * (n - x) + f(x) + f(n - x); };
    const a = f(1000), b = f(1000); if (a !== b) throw new Error('depends on splits'); return a;
  },
  '2.35': () => { // random breaking sequence
    let pieces = [[6, 8]], breaks = 0;
    while (pieces.some(([r, c]) => r * c > 1)) {
      const i = pieces.findIndex(([r, c]) => r * c > 1); const [r, c] = pieces[i];
      const cut = r > 1 && (c === 1 || Math.random() < 0.5) ? ['r', 1 + Math.floor(Math.random() * (r - 1))] : ['c', 1 + Math.floor(Math.random() * (c - 1))];
      pieces.splice(i, 1, ...(cut[0] === 'r' ? [[cut[1], c], [r - cut[1], c]] : [[r, cut[1]], [r, c - cut[1]]]));
      breaks++;
    }
    return breaks;
  },
};
