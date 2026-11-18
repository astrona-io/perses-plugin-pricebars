import type { PanelData } from "@perses-dev/plugin-system";
import type { TimeSeriesData } from "@perses-dev/spec";

import { DEFAULT_BANDS, PriceBand } from "./price-bar-chart-types";

export interface Bar {
  /** The category label value, such as `2026-11-18 17:00`. */
  category: string;
  /** Local start time parsed from the category, or undefined when it is not a date. */
  start?: number;
  value: number;
  /** Value as a percentage of the average of all bars. */
  percent: number;
  band: PriceBand;
}

export interface Model {
  bars: Bar[];
  average?: number;
  /** Index of the bar whose hour holds `now`, if any. */
  current?: number;
}

const CATEGORY_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

/** A `YYYY-MM-DD HH:mm[:ss]` label as local time in ms, or undefined. */
export function parseLocalTime(text: string): number | undefined {
  const m = CATEGORY_TIME.exec(text.trim());
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m;
  const t = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? 0),
  ).getTime();
  return Number.isFinite(t) ? t : undefined;
}

/** The last non-null value of a series. */
function lastValue(values: Array<[number, number | null]>): number | undefined {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i]?.[1];
    if (v !== null && v !== undefined && Number.isFinite(v)) return v;
  }
  return undefined;
}

/** The band a percentage of the average falls in: the first whose upTo it does not exceed. */
export function bandFor(percent: number, bands: PriceBand[]): PriceBand {
  const list = bands.length > 0 ? bands : DEFAULT_BANDS;
  for (const b of list) {
    if (b.upTo === undefined || percent <= b.upTo) return b;
  }
  return list[list.length - 1]!;
}

/**
 * One bar per category label value, from the last value of every series in every query, summed
 * per category and sorted by it. `now` picks the current bar: the last one starting at or before
 * it, as long as `now` is before the next bar's start (or within the step for the last bar).
 */
export function buildModel(
  queryResults: Array<PanelData<TimeSeriesData>>,
  options: { categoryLabel: string; bands: PriceBand[]; now: number },
): Model {
  const sums = new Map<string, number>();
  for (const result of queryResults) {
    for (const s of result.data?.series ?? []) {
      const category = s.labels?.[options.categoryLabel] ?? s.name;
      const v = lastValue(s.values);
      if (category === undefined || v === undefined) continue;
      sums.set(category, (sums.get(category) ?? 0) + v);
    }
  }
  const entries = [...sums.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  if (entries.length === 0) return { bars: [] };

  const average =
    entries.reduce((total, [, v]) => total + v, 0) / entries.length;
  const bars: Bar[] = entries.map(([category, value]) => {
    const percent = average !== 0 ? (value / average) * 100 : 100;
    return {
      category,
      start: parseLocalTime(category),
      value,
      percent,
      band: bandFor(percent, options.bands),
    };
  });

  let current: number | undefined;
  for (let i = 0; i < bars.length; i++) {
    const start = bars[i]!.start;
    if (start === undefined || start > options.now) continue;
    const next = bars[i + 1]?.start;
    const prev = bars[i - 1]?.start;
    const end =
      next ?? (prev !== undefined ? start + (start - prev) : undefined);
    if (end === undefined || options.now < end) current = i;
  }
  return { bars, average, current };
}

/** A hex colour darkened toward black by `amount` (0 to 1). Non-hex colours come back unchanged. */
export function darken(color: string, amount: number): string {
  let hex = color.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return color;
  const channel = (i: number): string =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
