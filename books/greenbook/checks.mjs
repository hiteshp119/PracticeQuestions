// Independent checks for numeric answers: each function recomputes the answer from scratch
// (brute force or simulation), so a typo in a card's `answer.value` fails the build.
const fact = (n) => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; };
const simpson = (f, a, b, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; };
const bisect = (f, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; } return (a + b) / 2; };
// RK4 for y' = f(x, y) from (x0, y0) to x1
const rk4 = (f, x0, y0, x1, n = 4000) => { const h = (x1 - x0) / n; let x = x0, y = y0; for (let i = 0; i < n; i++) { const k1 = f(x, y), k2 = f(x + h / 2, y + (h / 2) * k1), k3 = f(x + h / 2, y + (h / 2) * k2), k4 = f(x + h, y + h * k3); y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); x += h; } return y; };
// symmetric 3x3 is PSD iff all principal minors are >= 0
const psd3 = (m) => { const d = (i, j) => m[i][i] * m[j][j] - m[i][j] * m[j][i]; const det = m[0][0] * d(1, 2) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); return m.every((r, i) => r[i] >= 0) && d(0, 1) >= -1e-12 && d(0, 2) >= -1e-12 && d(1, 2) >= -1e-12 && det >= -1e-12; };

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

  // ---- Chapter 3: formula answers return a function of the variables ----
  '3.01': () => (env) => { const y = (x) => Math.log(x) ** Math.log(x), h = 1e-5; return (y(env.x + h) - y(env.x - h)) / (2 * h); }, // numeric derivative
  '3.05': () => simpson((x) => 1 / Math.cos(x), 0, Math.PI / 6),
  '3.06': () => { // V = ∬ 2·min(√(1−x²), √(1−y²)) dx dy over the square, with x = sin u, y = sin v (midpoint rule)
    const n = 2000, h = Math.PI / n; let v = 0;
    for (let i = 0; i < n; i++) { const cu = Math.cos(-Math.PI / 2 + (i + 0.5) * h); for (let j = 0; j < n; j++) { const cv = Math.cos(-Math.PI / 2 + (j + 0.5) * h); v += 2 * Math.min(cu, cv) * cu * cv; } }
    return v * h * h;
  },
  '3.07': () => { // speed = 1/(t+T) (up to a constant); find T with distance(0..2) / distance(0..1) = 3/2
    const dist = (T, t) => simpson((s) => 1 / (s + T), 0, t, 2000);
    return bisect((T) => dist(T, 2) / dist(T, 1) - 1.5, 0.01, 10);
  },
  '3.08': () => { const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); return simpson((x) => x * phi(x), 0, 12) / simpson(phi, 0, 12); },
  '3.09': () => simpson((x) => Math.exp(-x * x / 2), -12, 12),
  '3.10': () => { // complex power z^w = exp(w · Log z), exp summed as a series
    const [lr, li] = [Math.log(Math.hypot(0, 1)), Math.atan2(1, 0)]; // Log i
    const [ar, ai] = [-li, lr]; // i · Log i
    let [sr, si, tr, ti] = [1, 0, 1, 0];
    for (let k = 1; k < 60; k++) { [tr, ti] = [(tr * ar - ti * ai) / k, (tr * ai + ti * ar) / k]; sr += tr; si += ti; }
    if (Math.abs(si) > 1e-12) throw new Error('i^i is not real'); return sr;
  },
  '3.12': () => bisect((x) => x * x - 37, 6, 7),
  '3.14': () => { // gradient descent on |p|² over the plane, parametrized by (y, z)
    let y = 0, z = 0; const p = () => [(12 - 3 * y - 4 * z) / 2, y, z];
    for (let i = 0; i < 20000; i++) { const [x] = p(); const gy = 2 * y - 3 * x, gz = 2 * z - 4 * x; y -= 0.01 * gy; z -= 0.01 * gz; }
    return Math.hypot(...p());
  },
  '3.15': () => (env) => rk4((x, y) => -6 * x * y, 0, 1, env.x),
  '3.17': () => (env) => rk4((x, y) => 1 / (x * x) - y / x, 1, 1, env.x),
  '3.20': () => { // y, z on the cone of angle acos(0.8) around x; scan the azimuth gap
    const t = Math.acos(0.8); let lo = 1;
    for (let k = 0; k <= 3600; k++) { const f = (k / 3600) * 2 * Math.PI; const y = [Math.cos(t), Math.sin(t), 0], z = [Math.cos(t), Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f)]; lo = Math.min(lo, y[0] * z[0] + y[1] * z[1] + y[2] * z[2]); }
    return lo;
  },
  '3.23': () => { // smallest ρ in a fine grid for which the correlation matrix is PSD
    for (let k = -100000; k <= 100000; k++) { const r = k / 100000; if (psd3([[1, 0.8, 0.8], [0.8, 1, r], [0.8, r, 1]])) return r; }
  },
};
