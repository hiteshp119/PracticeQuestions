// Independent checks for numeric answers: each function recomputes the answer from scratch
// (brute force or simulation), so a typo in a card's `answer.value` fails the build.
const fact = (n) => { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; };
const simpson = (f, a, b, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; };
const bisect = (f, a, b) => { for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; } return (a + b) / 2; };
// RK4 for y' = f(x, y) from (x0, y0) to x1
const rk4 = (f, x0, y0, x1, n = 4000) => { const h = (x1 - x0) / n; let x = x0, y = y0; for (let i = 0; i < n; i++) { const k1 = f(x, y), k2 = f(x + h / 2, y + (h / 2) * k1), k3 = f(x + h / 2, y + (h / 2) * k2), k4 = f(x + h, y + h * k3); y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); x += h; } return y; };
const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
// expected time / probability by iterating a fixed-point equation x -> f(x) until it stops moving
const iterate = (f, x, n = 100000) => { for (let i = 0; i < n; i++) { const y = f(x); if (Math.abs(y - x) < 1e-15) return y; x = y; } return x; };
// Gaussian elimination with partial pivoting: solve A x = b
const solve = (A, b) => { const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / r[i]); };
// coin-pattern race: states = longest suffix of the history that is a prefix of some pattern; returns P(each pattern wins) and E[time]
const patternRace = (pats) => {
  const states = [...new Set(pats.flatMap((p) => [...Array(p.length).keys()].map((k) => p.slice(0, k))))];
  const next = (s, c) => { const t = s + c; if (pats.includes(t)) return t; for (let k = 0; k <= t.length; k++) { const u = t.slice(k); if (states.includes(u)) return u; } return ''; };
  const idx = new Map(states.map((s, i) => [s, i])), n = states.length;
  const run = (val) => { const A = states.map((s, i) => states.map((_, j) => (i === j ? 1 : 0))), b = states.map(() => 0);
    states.forEach((s, i) => { for (const c of 'HT') { const t = next(s, c); if (idx.has(t)) A[i][idx.get(t)] -= 0.5; else b[i] += 0.5 * val(t); } b[i] += val(null); });
    return solve(A, b)[idx.get('')]; };
  return { win: pats.map((p) => run((t) => (t === p ? 1 : 0))), time: run((t) => (t === null ? 1 : 0)) };
};
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

  // ---- Chapter 4 ----
  '4.01': () => { // exact binomial sums for several n
    for (const n of [1, 2, 5, 10, 20]) { let p = 0; for (let a = 0; a <= n + 1; a++) for (let b = 0; b < a && b <= n; b++) p += choose(n + 1, a) * choose(n, b) / 2 ** (2 * n + 1); if (Math.abs(p - 0.5) > 1e-12) throw new Error(`n=${n}: ${p}`); }
    return 0.5;
  },
  '4.02': () => { let w = 0, t = 0; for (let i = 0; i < 52; i++) for (let j = 0; j < 52; j++) if (i !== j) { t++; if (i % 13 > j % 13) w++; } return w / t; },
  '4.03': () => { // exact: displaced passenger k picks uniformly among seat 1 and the free seats k+1..n
    const n = 100, P = new Array(n + 2).fill(0); // P[k] = P(last gets own seat | passenger k is choosing at random, seats 2..k-1 taken)
    for (let k = n; k >= 1; k--) { const free = k === 1 ? n : n - k + 1; let s = 1; for (let j = k + 1; j < n; j++) s += P[j]; P[k] = k === n ? 0 : s / free; }
    return P[1];
  },
  '4.04': () => (env) => { // Stevens: P(max spacing of N points on a circle > 1/2) = Σ (−1)^{k+1} C(N,k) (1 − k/2)_+^{N−1}
    const N = env.n; let p = 0; for (let k = 1; k <= N; k++) { const b = 1 - k / 2; if (b <= 0) break; p += (k % 2 ? 1 : -1) * choose(N, k) * b ** (N - 1); } return p;
  },
  '4.07': () => { // one lock per 5-group, keys to the other 6; verify on all groups and return the lock count
    const groups = []; for (let m = 0; m < 2048; m++) if (m.toString(2).split('1').length - 1 === 5) groups.push(m);
    const opens = (team) => groups.every((g) => (team & ~g) !== 0); // someone in the team is outside g
    for (let m = 0; m < 2048; m++) { const c = m.toString(2).split('1').length - 1; if (c === 6 && !opens(m)) throw new Error('6 cannot open'); if (c === 5 && opens(m)) throw new Error('5 can open'); }
    const keys = groups.filter((g) => !(g & 1)).length; if (keys !== 252) throw new Error(`keys ${keys}`);
    return groups.length;
  },
  '4.08': () => (env) => { let p = 1; for (let r = 1; r < env.n; r++) { const m = 2 ** (env.n - r + 1); p *= (m - 2) / (m - 1); } return p; },
  '4.09': () => perms([0, 1, 2, 3, 4]).filter((p) => p.every((x, i) => x !== i)).length / 120,
  '4.10': () => { let q = 1; for (let n = 1; ; n++) { q *= (366 - n) / 365; if (1 - q > 0.5) return n; } },
  '4.11': () => { // (1+√2)^3000 = a + b√2 with integers; digits of the fractional part of b√2
    let a = 1n, b = 0n; for (let i = 0; i < 3000; i++) [a, b] = [a + 2n * b, a + b];
    const D = 10n ** 120n, t = 2n * b * b * D * D; let x = BigInt('1' + '0'.repeat(Math.ceil(t.toString().length / 2))); // integer sqrt of t
    for (;;) { const y = (x + t / x) / 2n; if (y >= x) break; x = y; }
    const frac = (x % D).toString().padStart(120, '0'); return +frac[99];
  },
  '4.12': () => { let c = 0; for (let x = 1; x <= 100000; x++) if (Number((BigInt(x) ** 3n) % 100n) === 11) c++; return c / 100000; },
  '4.13': () => { const fam = [['B', 'B'], ['B', 'G'], ['G', 'B'], ['G', 'G']].filter((f) => f.includes('B')); return fam.filter((f) => f[0] === 'B' && f[1] === 'B').length / fam.length; },
  '4.14': () => { let seenB = 0, both = 0; for (const f of [['B', 'B'], ['B', 'G'], ['G', 'B'], ['G', 'G']]) for (const c of [0, 1]) if (f[c] === 'B') { seenB += 1 / 8; if (f[0] === 'B' && f[1] === 'B') both += 1 / 8; } return both / seenB; },
  '4.15': () => { let boys = 0; for (let k = 0; k < 200; k++) boys += k / 2 ** (k + 1); return 1 / (1 + boys); }, // one girl per family
  '4.16': () => { const u = 1 / 1000, f = 999 / 1000 * 0.5 ** 10; return u / (u + f); },
  '4.18': () => { const ps = perms([0, 1, 2]).filter((p) => p[0] < p[1]); return ps.filter((p) => p[2] > p[0]).length / ps.length; },
  '4.19': () => { let best = 0, arg = 0, q = 1; for (let n = 1; n < 366; n++) { const p = q * (n - 1) / 365; if (p > best) { best = p; arg = n; } q *= (365 - (n - 1)) / 365; } return arg; },
  '4.20': () => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let d = 1; d <= 6; d++) if (a < b && b < d) c++; return c / 216; },
  '4.21': () => { let w = 0; for (let car = 0; car < 3; car++) for (let pick = 0; pick < 3; pick++) { const opens = [0, 1, 2].filter((d) => d !== car && d !== pick); const host = opens[0]; const sw = [0, 1, 2].find((d) => d !== pick && d !== host); if (sw === car) w++; } return w / 9; },
  '4.22': () => iterate((p) => (1 + p + p * p + p ** 3) / 4, 0, 1e7), // extinction prob = limit of P(extinct by n)
  '4.23': () => { // exact DP on the reversed (still uniform) sequence: red must be the last colour to appear
    const memo = new Map();
    const f = (r, b, g, sb, sg) => { // counts left; whether blue / green already seen
      if (sb && sg) return 1; const key = `${r},${b},${g},${sb},${sg}`; if (memo.has(key)) return memo.get(key);
      const t = r + b + g; let p = 0; // drawing red before both others are seen fails
      if (b) p += (b / t) * f(r, b - 1, g, 1, sg); if (g) p += (g / t) * f(r, b, g - 1, sb, 1);
      memo.set(key, p); return p;
    };
    return f(10, 20, 30, 0, 0);
  },
  '4.24': () => { // states: (whose toss, H pending?) solved by value iteration; value = P(A wins)
    let v = { A0: 0, A1: 0, B0: 0, B1: 0 };
    for (let i = 0; i < 2000; i++) v = { A0: 0.5 * v.B1 + 0.5 * v.B0, A1: 0.5 * v.B1 + 0.5 * 1, B0: 0.5 * v.A1 + 0.5 * v.A0, B1: 0.5 * v.A1 + 0.5 * 0 };
    return v.A0;
  },
  '4.25': () => [1, 2, 3, 4, 5, 6].filter((c) => c % 2 === 1).length / 6,
  '4.26': () => { let p = 0; for (let k = 0; k < 400; k++) p += (5 / 6) ** k / 6 * (k % 2 ? 1 : 0); return p; }, // second player is shot on even-numbered pulls
  '4.29': () => { // count: aces one per hand, rest anywhere; ratio of multinomials in logs
    const lf = (n) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
    return Math.exp(lf(4) + lf(48) - 4 * lf(12) - (lf(52) - 4 * lf(13)));
  },
  '4.31': () => { let P = [0, 1]; for (let n = 2; n < 100; n++) { const Q = new Array(n + 2).fill(0); for (let k = 0; k <= n; k++) if (P[k]) { Q[k + 1] += P[k] * k / n; Q[k] += P[k] * (n - k) / n; } P = Q; } return P[50]; },
  '4.32': () => bisect((p) => 1 - (1 - p) ** 4 - 609 / 625, 0, 1),
  '4.33': () => simpson((x) => (Math.min(60, x + 5) - Math.max(0, x - 5)) / 60, 0, 60, 60000) / 60,
  '4.34': () => { // for each first cut x, measure the set of second cuts y with all three pieces < 1/2 (by scanning y), then average over x
    const n = 4000; let tot = 0;
    for (let i = 0; i < n; i++) { const x = (i + 0.5) / n; let len = 0;
      // the good y-set is an interval; find it by bisection on its two endpoints from a known interior point
      const ok = (y) => { const a = Math.min(x, y), b = Math.max(x, y); return a < 0.5 && b - a < 0.5 && 1 - b < 0.5; };
      const mid = x < 0.5 ? x / 2 + 0.5 : x / 2; if (ok(mid)) { const lo = bisect((y) => (ok(y) ? 1 : -1), mid, x < 0.5 ? 0.5 - 1e-15 : 0), hi = bisect((y) => (ok(y) ? 1 : -1), mid, x < 0.5 ? 1 : 0.5 + 1e-15); len = Math.abs(hi - lo); }
      tot += len; }
    return tot / n;
  },
  '4.35': () => { const l = 0.1, f = (x) => l * Math.exp(-l * x); return simpson((x) => x * x * f(x), 0, 600) / (2 * simpson((x) => x * f(x), 0, 600)); }, // E[X²]/(2E[X])
  '4.37': () => { // brute-force the loop count for small n over all pairings, confirm the recursion, then sum it for 100
    const pairings = (ends) => { if (!ends.length) return [[]]; const [a, ...rest] = ends; return rest.flatMap((b, i) => pairings(rest.filter((_, j) => j !== i)).map((p) => [[a, b], ...p])); };
    for (const n of [1, 2, 3, 4]) {
      const all = pairings([...Array(2 * n).keys()]); let tot = 0;
      for (const pr of all) { const partner = []; for (const [a, b] of pr) { partner[a] = b; partner[b] = a; } const seen = new Set(); let loops = 0;
        for (let s = 0; s < 2 * n; s++) { if (seen.has(s)) continue; loops++; let e = s; do { seen.add(e); seen.add(e ^ 1); e = partner[e ^ 1]; } while (e !== s && !seen.has(e)); }
        tot += loops; }
      let want = 0; for (let k = 1; k <= n; k++) want += 1 / (2 * k - 1);
      if (Math.abs(tot / all.length - want) > 1e-12) throw new Error(`n=${n}: ${tot / all.length} vs ${want}`);
    }
    let s = 0; for (let k = 1; k <= 100; k++) s += 1 / (2 * k - 1); return s;
  },
  '4.38': () => (env) => { // golden-section minimum of the hedged variance
    const v = (h) => env.sa ** 2 - 2 * h * env.rho * env.sa * env.sb + h * h * env.sb ** 2;
    let a = -100, b = 100; for (let i = 0; i < 300; i++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (v(m1) < v(m2)) b = m2; else a = m1; } return (a + b) / 2;
  },
  '4.39': () => iterate((e) => (1 + 2 + 3) / 6 + (4 + 5 + 6 + 3 * e) / 6, 0, 1e6),
  '4.40': () => { let e = 0, pNone = 1; for (let k = 1; k <= 49; k++) { const pAce = 4 / (53 - k); e += k * pNone * pAce; pNone *= 1 - pAce; } return e; },
  '4.41': () => (env) => { // iterate densities of S_k restricted to [0, 1]: f_k(s) = ∫_0^s f_{k−1}
    const m = 20000, h = 1 / m; let f = new Array(m + 1).fill(1);
    for (let k = 2; k <= env.n; k++) { const g = new Array(m + 1).fill(0); for (let i = 1; i <= m; i++) g[i] = g[i - 1] + ((f[i - 1] + f[i]) / 2) * h; f = g; }
    let p = 0; for (let i = 1; i <= m; i++) p += ((f[i - 1] + f[i]) / 2) * h; return p;
  },
  '4.45': () => { const n = 1000; let sy = 0, sz = 0, syy = 0, szz = 0, syz = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = (i + 0.5) / n, b = (j + 0.5) / n, y = Math.min(a, b), z = Math.max(a, b); sy += y; sz += z; syy += y * y; szz += z * z; syz += y * z; }
    const N = n * n, my = sy / N, mz = sz / N; return (syz / N - my * mz) / Math.sqrt((syy / N - my * my) * (szz / N - mz * mz)); },
  '4.46': () => { // E[max of 500 uniforms] = ∫ (1 − x^500) dx, plus one collision simulation that all ants are gone by then
    return simpson((x) => 1 - x ** 500, 0, 1, 200000);
  },

  // ---- Chapter 5 ----
  '5.01': () => solve([[1, -2 / 3], [-1 / 3, 1]], [0, 2 / 3])[0], // a1 = 2/3 a2, a2 = 1/3 a1 + 2/3
  '5.02': () => { // brute: distribution of two-dice sums, then the two-state chain solved as a linear system
    const P = new Array(13).fill(0); for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) P[a + b] += 1 / 36;
    const o = 1 - P[7] - P[12]; return solve([[1 - o, -P[7]], [-o, 1]], [P[12], P[12]])[0];
  },
  '5.03': () => { const t = patternRace(['HHH']).time, u = patternRace(['THH']).time; if (Math.abs(u - 8) > 1e-9) throw new Error(`THH ${u}`); return t; },
  '5.04': () => patternRace(['HHH', 'THH']).win[0],
  '5.05': () => { // player 1 minimizes player 2's best reply
    const all = []; for (let m = 0; m < 8; m++) all.push([0, 1, 2].map((k) => ((m >> (2 - k)) & 1 ? 'T' : 'H')).join(''));
    return Math.min(...all.map((a) => Math.max(...all.filter((b) => b !== a).map((b) => patternRace([a, b]).win[1]))));
  },
  '5.06': () => (env) => { // exact chain on colour-class partitions of n balls
    const n = env.n, parts = []; const gen = (rest, max, cur) => { if (!rest) { parts.push(cur); return; } for (let k = Math.min(rest, max); k >= 1; k--) gen(rest - k, k, [...cur, k]); }; gen(n, n, []);
    const key = (p) => p.join(','), idx = new Map(parts.map((p, i) => [key(p), i])), N = parts.length, tot = n * (n - 1);
    const A = parts.map((_, i) => parts.map((_, j) => (i === j ? 1 : 0))), b = parts.map(() => 0);
    parts.forEach((p, i) => { if (p.length === 1) return; b[i] = 1;
      for (let x = 0; x < p.length; x++) for (let y = 0; y < p.length; y++) { if (x === y) { A[i][i] -= p[x] * (p[x] - 1) / tot; continue; }
        const q = [...p]; q[x]--; q[y]++; const r = q.filter((v) => v > 0).sort((u, v) => v - u); A[i][idx.get(key(r))] -= p[x] * p[y] / tot; } });
    return solve(A, b)[idx.get(key(Array(n).fill(1)))];
  },
  '5.07': () => { // linear systems on positions 1..99 of the bridge: hitting probability and expected steps, from 17
    const n = 100, sys = (rhs, hi) => { const A = [], b = []; for (let i = 1; i < n; i++) { const row = new Array(n - 1).fill(0); row[i - 1] = 1; if (i > 1) row[i - 2] = -0.5; if (i < n - 1) row[i] = -0.5; A.push(row); b.push(rhs + (i === n - 1 ? 0.5 * hi : 0)); } return solve(A, b); };
    const p = sys(0, 1)[16]; if (Math.abs(p - 0.17) > 1e-9) throw new Error(`p ${p}`);
    return sys(1, 0)[16];
  },
  '5.08': () => iterate((e) => (1 + 2 + 3) / 6 + (4 + 5 + 6 + 3 * e) / 6, 0, 1e6),
  '5.09': () => (env) => { // DP count of never-negative paths over all C(2n, n)
    const n = env.n; let row = new Map([[0, 1]]); for (let s = 0; s < 2 * n; s++) { const nx = new Map(); for (const [h, c] of row) for (const d of [1, -1]) { const g = h + d; if (g >= 0) nx.set(g, (nx.get(g) || 0) + c); } row = nx; }
    return (row.get(0) || 0) / choose(2 * n, n);
  },
  '5.10': () => (env) => patternRace(['H'.repeat(env.n)]).time,
  '5.12': () => { let v = 3.5; for (let k = 0; k < 2; k++) { let s = 0; for (let x = 1; x <= 6; x++) s += Math.max(x, v) / 6; v = s; } return v; },
  '5.13': () => { const f = (i, j) => (i === 4 ? 100 : j === 4 ? -100 : (f(i + 1, j) + f(i, j + 1)) / 2); return (f(1, 0) - f(0, 1)) / 2; },
  '5.14': () => { const top = 300, V = []; for (let n = top; n >= 0; n--) { let c = 0; for (let k = 1; k <= 5; k++) c += (n + k > top ? n + k : V[n + k]) / 6; V[n] = Math.max(n, c); } return V[0]; },
  '5.15': () => { const V = []; for (let b = 0; b <= 26; b++) { V[b] = []; for (let r = 0; r <= 26; r++) V[b][r] = r === 0 ? b : b === 0 ? 0 : Math.max(b - r, (b / (b + r)) * V[b - 1][r] + (r / (b + r)) * V[b][r - 1]); } return V[26][26]; },
  '5.17': () => { const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), m = (k) => simpson((x) => x ** k * phi(x), -12, 12); return (m(3) - m(1) * m(2)) / Math.sqrt((m(2) - m(1) ** 2) * (m(4) - m(2) ** 2)); },
  '5.18': () => { // P(X > 0, X + Y < 0) for i.i.d. N(0,1): ∫_0^∞ φ(x) P(Y < −x) dx with the tail by Simpson
    const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), tail = (x) => simpson(phi, x, 12, 2000);
    return simpson((x) => phi(x) * tail(x), 0, 12, 2000);
  },
  '5.19': () => { // E[T] = f(0) where ½f'' = −1 on (−1, 1), f(±1) = 0, by finite differences
    const m = 400, h = 2 / m, A = [], b = []; for (let i = 1; i < m; i++) { const row = new Array(m - 1).fill(0); row[i - 1] = -2 / (h * h) * 0.5; if (i > 1) row[i - 2] = 0.5 / (h * h); if (i < m - 1) row[i] = 0.5 / (h * h); A.push(row); b.push(-1); }
    return solve(A, b)[m / 2 - 1];
  },
  '5.21': () => { // fine-grid symmetric walk from 0 between −5 and 3; also checks the drift formula against the ODE ½P'' + mP' = 0
    const m = 0.3, L = -5, U = 3, k = 800, h = (U - L) / k, A = [], b = [];
    for (let i = 1; i < k; i++) { const row = new Array(k - 1).fill(0); row[i - 1] = -1 / (h * h); if (i > 1) row[i - 2] = 0.5 / (h * h) - m / (2 * h); if (i < k - 1) row[i] = 0.5 / (h * h) + m / (2 * h); A.push(row); b.push(i === k - 1 ? -(0.5 / (h * h) + m / (2 * h)) : 0); }
    const P = solve(A, b)[Math.round(-L / h) - 1], want = (Math.exp(10 * m) - 1) / (Math.exp(10 * m) - Math.exp(-6 * m));
    if (Math.abs(P - want) > 1e-4) throw new Error(`drift formula ${want} vs ODE ${P}`);
    return (0 - L) / (U - L); // fair walk: P(hit U) = distance to L / width
  },
  '5.22': () => { // ½P'' + P' = 0 on (−1, 20), P(−1) = 1, P(20) = 0; tridiagonal sweep
    const L = -1, U = 20, k = 42000, h = (U - L) / k, lo = 0.5 / (h * h) - 1 / (2 * h), di = -1 / (h * h), up = 0.5 / (h * h) + 1 / (2 * h);
    const cp = [], dp = []; for (let i = 1; i < k; i++) { const rhs = i === 1 ? -lo * 1 : 0; const mm = di - (i > 1 ? lo * cp[i - 1] : 0); cp[i] = up / mm; dp[i] = (rhs - (i > 1 ? lo * dp[i - 1] : 0)) / mm; }
    const x = []; x[k] = 0; for (let i = k - 1; i >= 1; i--) x[i] = dp[i] - cp[i] * (x[i + 1] ?? 0); return x[Math.round(-L / h)];
  },

  // ---- Chapter 6 ----
  '6.09': () => (env) => { // recombining lattice with r = 0: up u, down 1/u, risk-neutral p; P(hit H = u^k before u^-m), solved as a linear system
    const k = 20, m = 400, u = env.h ** (1 / k), d = 1 / u, p = (1 - d) / (u - d), n = k + m - 1; // states j = -m+1 .. k-1
    const A = [], b = []; for (let i = 0; i < n; i++) { const row = new Array(n).fill(0); row[i] = 1; if (i + 1 < n) row[i + 1] = -p; if (i > 0) row[i - 1] = -(1 - p); A.push(row); b.push(i === n - 1 ? p : 0); }
    return solve(A, b)[m - 1]; // state j = 0
  },
  '6.10': () => (env) => { const { s, r, sigma, t } = env; const ST = (e) => s * Math.exp((r - sigma * sigma / 2) * t + sigma * Math.sqrt(t) * e);
    return Math.exp(-r * t) * simpson((e) => Math.exp(-e * e / 2) / Math.sqrt(2 * Math.PI) / ST(e), -14, 14, 40000); },
  '6.14': () => { // exact Black–Scholes with r = 0 by integrating the payoff against the lognormal
    const S = 100, K = 100, v = 0.2, T = 0.25, ST = (e) => S * Math.exp(-v * v / 2 * T + v * Math.sqrt(T) * e);
    return simpson((e) => Math.max(ST(e) - K, 0) * Math.exp(-e * e / 2) / Math.sqrt(2 * Math.PI), -12, 12, 40000);
  },
  '6.25': () => { const v = (w) => 0.04 * w * w + 0.09 * (1 - w) ** 2 + 2 * 0.5 * 0.2 * 0.3 * w * (1 - w); let a = -2, b = 3; for (let i = 0; i < 300; i++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (v(m1) < v(m2)) b = m2; else a = m1; } return (a + b) / 2; },
  '6.27': () => { // price the inverse floater's own cash flows on a flat semiannual curve y (future floating rates = y, first coupon set at 7.5%), then −P'/P
    const price = (y) => { let P = 0; for (let k = 1; k <= 10; k++) { const rate = k === 1 ? 0.075 : y; const cf = 100 * (0.30 - 3 * rate) / 2 + (k === 10 ? 100 : 0); P += cf / (1 + y / 2) ** k; } return P; };
    const h = 1e-6, y = 0.075; if (Math.abs(price(y) - 100) > 1e-9) throw new Error(`price ${price(y)}`);
    return -(price(y + h) - price(y - h)) / (2 * h) / price(y);
  },

  // ---- Chapter 7 ----
  '7.08': () => { // run the pairwise min/max algorithm on random arrays and count comparisons
    let worst = 0;
    for (let t = 0; t < 200; t++) {
      const a = Array.from({ length: 100 }, Math.random); let c = 0; const lt = (x, y) => { c++; return x < y; };
      const lo = [], hi = []; for (let i = 0; i < 100; i += 2) { if (lt(a[i], a[i + 1])) { lo.push(a[i]); hi.push(a[i + 1]); } else { lo.push(a[i + 1]); hi.push(a[i]); } }
      let mn = lo[0], mx = hi[0]; for (let i = 1; i < 50; i++) { if (lt(lo[i], mn)) mn = lo[i]; if (lt(mx, hi[i])) mx = hi[i]; }
      if (mn !== Math.min(...a) || mx !== Math.max(...a)) throw new Error('wrong min/max'); worst = Math.max(worst, c);
    }
    return worst;
  },
  '7.11': () => { // count the calls the naive recursion makes, take the ratio T(n+1)/T(n) for a large n
    const calls = (n) => { let c = 0; const f = (k) => { c++; return k <= 0 ? 0 : k === 1 ? 1 : f(k - 1) + f(k - 2); }; f(n); return c; };
    return 100 * calls(27) / calls(26);
  },
  '7.12': () => { const A = [1, 2, -5, 4, -3, 2, 6, -5, -1]; let best = -Infinity; for (let i = 0; i < A.length; i++) { let s = 0; for (let j = i; j < A.length; j++) { s += A[j]; best = Math.max(best, s); } } return best; },
  '7.16': () => { // simulate the 10-mouse test for every bottle: the dead mice must decode to that bottle
    for (let bottle = 1; bottle <= 1000; bottle++) { let label = 0; for (let k = 1; k <= 10; k++) if ((bottle >> (k - 1)) & 1) label += 2 ** (k - 1); if (label !== bottle) throw new Error(`bottle ${bottle}`); }
    return [6, 7, 9].reduce((s, k) => s + 2 ** (k - 1), 0);
  },
};
