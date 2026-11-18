/** Linear map from a domain to a range. */
export function linear(
  [d0, d1]: [number, number],
  [r0, r1]: [number, number],
): (x: number) => number {
  const span = d1 - d0 || 1;
  return (x) => r0 + ((x - d0) / span) * (r1 - r0);
}

/** About `count` round tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  const first = Math.ceil(min / step - 1e-9) * step;
  for (let v = first; v <= max + step * 1e-9; v += step) {
    ticks.push(Math.round(v / step) * step || 0);
  }
  return ticks;
}
