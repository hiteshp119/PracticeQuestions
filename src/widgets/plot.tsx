import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';

/** Linear map from data coordinates to an SVG box with a small left/bottom margin for labels. */
export function frame(x0: number, x1: number, y0: number, y1: number, W = 340, H = 200, m = { l: 34, r: 10, t: 8, b: 22 }) {
  const sx = (x: number) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
  const sy = (y: number) => m.t + (1 - (y - y0) / (y1 - y0)) * (H - m.t - m.b);
  /** SVG path of f sampled on [a, b]; Axes clips it to the plot box. */
  const path = (f: (x: number) => number, a = x0, b = x1, n = 240) => {
    let d = '', pen = false;
    const big = 50 * (y1 - y0);
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n, y = f(x);
      if (!isFinite(y) || Math.abs(y) > big) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  return { sx, sy, path, W, H, x0, x1, y0, y1, m };
}

type F = ReturnType<typeof frame>;

/** Axes box with the x-axis at y = 0 (when visible) and a few tick labels. */
export function Axes({ f, xt = [], yt = [], children, label }: { f: F; xt?: number[]; yt?: number[]; children?: ComponentChildren; label: string }) {
  const { sx, sy, W, H, x0, x1, y0, y1 } = f;
  const clip = `clip${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const yAxis = y0 <= 0 && y1 >= 0 ? 0 : y0;
  const xAxis = x0 <= 0 && x1 >= 0 ? 0 : x0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style="display:block">
      <line x1={sx(x0)} y1={sy(yAxis)} x2={sx(x1)} y2={sy(yAxis)} stroke="var(--line)" />
      <line x1={sx(xAxis)} y1={sy(y0)} x2={sx(xAxis)} y2={sy(y1)} stroke="var(--line)" />
      {xt.map((t) => <text key={`x${t}`} x={sx(t)} y={sy(yAxis) + 15} text-anchor="middle">{+t.toFixed(2)}</text>)}
      {yt.map((t) => <text key={`y${t}`} x={sx(xAxis) - 5} y={sy(t) + 4} text-anchor="end">{+t.toFixed(2)}</text>)}
      <clipPath id={clip}><rect x={sx(x0)} y={sy(y1)} width={sx(x1) - sx(x0)} height={sy(y0) - sy(y1)} /></clipPath>
      <g clip-path={`url(#${clip})`}>{children}</g>
    </svg>
  );
}

/** Labelled range slider in the widget style. */
export function Slider({ id, label, value, min, max, step, show, onInput }: { id: string; label: string; value: number; min: number; max: number; step: number; show?: string; onInput: (v: number) => void }) {
  return (
    <label for={id}>{label} <span class="mono" style="color:var(--ink)">{show ?? value}</span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onInput={(e) => onInput(+(e.target as HTMLInputElement).value)} />
    </label>
  );
}

/** Seeded uniform RNG (LCG), so a widget looks the same on every render until re-seeded. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s + 0.5) / 4294967296; };
}
