import type { PanelData } from "@perses-dev/plugin-system";
import type { TimeSeries, TimeSeriesData } from "@perses-dev/spec";

export const HOUR = 3_600_000;

export function series(
  name: string,
  labels: Record<string, string>,
  values: Array<[number, number | null]>,
): TimeSeries {
  return { name, labels, values } as TimeSeries;
}

/** One query result per argument, in order. */
export function results(
  ...queries: TimeSeries[][]
): Array<PanelData<TimeSeriesData>> {
  return queries.map(
    (s) =>
      ({
        definition: {
          kind: "TimeSeriesQuery",
          spec: { plugin: { kind: "PrometheusTimeSeriesQuery", spec: {} } },
        },
        data: {
          series: s,
          timeRange: { start: new Date(0), end: new Date(HOUR) },
          stepMs: HOUR,
        },
      }) as unknown as PanelData<TimeSeriesData>,
  );
}

/** An hourly price series per entry, labelled start="YYYY-MM-DD HH:00". */
export function hours(day: string, prices: number[]): TimeSeries[] {
  return prices.map((p, h) =>
    series(
      "elpris_hour_dkk_per_kwh",
      { start: `${day} ${String(h).padStart(2, "0")}:00` },
      [[0, p]],
    ),
  );
}
