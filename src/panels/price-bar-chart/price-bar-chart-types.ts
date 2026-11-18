import type { FormatOptions } from "@perses-dev/components";
import type {
  LegendSpecOptions,
  OptionsEditorProps,
  PanelProps,
} from "@perses-dev/plugin-system";
import type { TimeSeriesData } from "@perses-dev/spec";

export type QueryData = TimeSeriesData;

export type PriceBarChartProps = PanelProps<PriceBarChartOptions, QueryData>;
export type PriceBarChartEditorProps = OptionsEditorProps<PriceBarChartOptions>;

/** A price band, as a share of the average of the shown bars. */
export interface PriceBand {
  /** Bars up to this percentage of the average (inclusive) take this band. Unset on the last band. */
  upTo?: number;
  /** Bar colour, `#rgb` or `#rrggbb`. */
  color: string;
  /** Shown in the legend and the tooltip. */
  label: string;
}

export interface AverageSpec {
  /** Draw the dashed average line. Default true. */
  show?: boolean;
  /** Shown in the legend and the tooltip. Default "average". */
  label?: string;
}

export interface PriceBarChartOptions {
  /**
   * Series label that names each bar, a local start time such as `2026-11-18 17:00`. Default
   * `start`. Bars are sorted by it; series with the same value are summed.
   */
  categoryLabel?: string;
  /** Lowest band first. Default: very cheap up to 75 %, under average up to 100 %, over average up to 115 %, high. */
  bands?: PriceBand[];
  average?: AverageSpec;
  /** Highlight the bar whose hour holds the current time: darker colour and a background column. Default true. */
  highlightCurrent?: boolean;
  format?: FormatOptions;
  /** The key under the chart. Hidden when unset. */
  legend?: LegendSpecOptions;
}

export const DEFAULT_CATEGORY_LABEL = "start";
export const DEFAULT_AVERAGE_LABEL = "average";
export const DEFAULT_FORMAT: FormatOptions = {
  unit: "decimal",
  decimalPlaces: 2,
};
export const DEFAULT_BANDS: PriceBand[] = [
  { upTo: 75, color: "#3274d9", label: "very cheap" },
  { upTo: 100, color: "#2e9e4f", label: "under average" },
  { upTo: 115, color: "#e0b400", label: "over average" },
  { color: "#c8372d", label: "high" },
];

export function createInitialPriceBarChartOptions(): PriceBarChartOptions {
  return {
    categoryLabel: DEFAULT_CATEGORY_LABEL,
    bands: DEFAULT_BANDS.map((b) => ({ ...b })),
    average: { show: true, label: DEFAULT_AVERAGE_LABEL },
    highlightCurrent: true,
    format: { ...DEFAULT_FORMAT },
    legend: { position: "bottom" },
  };
}
