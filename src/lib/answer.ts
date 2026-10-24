// Checks a typed answer against a numeric or formula answer.
// Accepts 1/2, 0.5, 50%, 3e-2, sqrt(2)/2, pi, e, 2^10, n/(n+1) …

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

function lex(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const src = s.replace(/\s+/g, '').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/π/g, 'pi');
  while (i < src.length) {
    const ch = src[i];
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
    if (num) { out.push({ t: 'num', v: parseFloat(num[0]) }); i += num[0].length; continue; }
    const id = /^[a-z_][a-z0-9_]*/i.exec(src.slice(i));
    if (id) { out.push({ t: 'id', v: id[0].toLowerCase() }); i += id[0].length; continue; }
    if ('+-*/^()%!,'.includes(ch)) { out.push({ t: 'op', v: ch }); i++; continue; }
    throw new Error(`Unexpected "${ch}"`);
  }
  // implicit multiplication: 2n, 2(…), )(, n(…)
  const res: Tok[] = [];
  for (let k = 0; k < out.length; k++) {
    const a = res[res.length - 1], b = out[k];
    const aEnd = a && (a.t === 'num' || (a.t === 'id' && !FUNCS[a.v] && a.v !== 'choose') || (a.t === 'op' && (a.v === ')' || a.v === '!' || a.v === '%')));
    const bStart = b.t === 'num' || b.t === 'id' || (b.t === 'op' && b.v === '(');
    if (aEnd && bStart) res.push({ t: 'op', v: '*' });
    res.push(b);
  }
  return res;
}

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt, ln: Math.log, log: Math.log, exp: Math.exp, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
};
const fact = (n: number) => { if (n < 0 || n > 170 || !Number.isInteger(n)) return Gamma(n + 1); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
function Gamma(z: number): number { // Lanczos
  const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * Gamma(1 - z));
  z -= 1; let x = p[0]; for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function evaluate(expr: string, vars: Record<string, number> = {}): number {
  const toks = lex(expr);
  let p = 0;
  const peek = () => toks[p];
  const take = (v?: string) => { const t = toks[p]; if (!t || (v && t.v !== v)) throw new Error(`Expected ${v || 'more'}`); p++; return t; };
  function expr0(): number { let x = term(); while (peek()?.t === 'op' && (peek().v === '+' || peek().v === '-')) { const o = take().v; const y = term(); x = o === '+' ? x + y : x - y; } return x; }
  function term(): number { let x = unary(); while (peek()?.t === 'op' && (peek().v === '*' || peek().v === '/')) { const o = take().v; const y = unary(); x = o === '*' ? x * y : x / y; } return x; }
  function unary(): number { if (peek()?.t === 'op' && peek().v === '-') { take(); return -unary(); } if (peek()?.t === 'op' && peek().v === '+') { take(); return unary(); } return power(); }
  function power(): number { const b = postfix(); if (peek()?.t === 'op' && peek().v === '^') { take(); return Math.pow(b, unary()); } return b; }
  function postfix(): number { let x = atom(); while (peek()?.t === 'op' && (peek().v === '!' || peek().v === '%')) { const o = take().v; x = o === '!' ? fact(x) : x / 100; } return x; }
  function atom(): number {
    const t = take();
    if (t.t === 'num') return t.v;
    if (t.t === 'op' && t.v === '(') { const x = expr0(); take(')'); return x; }
    if (t.t === 'id') {
      if (FUNCS[t.v]) { take('('); const x = expr0(); take(')'); return FUNCS[t.v](x); }
      if (t.v === 'choose') { take('('); const n = expr0(); take(','); const k = expr0(); take(')'); return fact(n) / (fact(k) * fact(n - k)); }
      if (t.v === 'pi') return Math.PI;
      if (t.v === 'e' && !(t.v in vars)) return Math.E;
      if (t.v in vars) return vars[t.v];
      throw new Error(`Unknown "${t.v}"`);
    }
    throw new Error('Unexpected symbol');
  }
  const v = expr0();
  if (p !== toks.length) throw new Error('Unexpected end');
  return v;
}

export type CheckResult = 'right' | 'wrong' | 'invalid';

export function check(input: string, type: string, value: number | string | null, vars: string[] | null, tol: number | null): CheckResult {
  if (!input.trim()) return 'invalid';
  try {
    if (type === 'number' && typeof value === 'number') {
      const x = evaluate(input);
      const t = tol ?? Math.max(1e-6, Math.abs(value) * 1e-4);
      return Math.abs(x - value) <= t ? 'right' : 'wrong';
    }
    if (type === 'expr' && typeof value === 'string' && vars) {
      // compare at several points (integers ≥ 3, so n/(n+1)-style answers are defined)
      const pts = [3, 4, 5, 7, 10, 13];
      for (let i = 0; i < pts.length; i++) {
        const env = Object.fromEntries(vars.map((v, j) => [v, pts[(i + j) % pts.length] + j]));
        const a = evaluate(input, env), b = evaluate(value, env);
        if (!isFinite(a) || Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return 'wrong';
      }
      return 'right';
    }
  } catch {
    return 'invalid';
  }
  return 'invalid';
}
