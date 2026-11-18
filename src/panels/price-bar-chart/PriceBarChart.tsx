import type { PanelPlugin } from "@perses-dev/plugin-system";

import {
  type PriceBarChartOptions,
  type PriceBarChartProps,
  createInitialPriceBarChartOptions,
} from "./price-bar-chart-types";
import { PriceBarChartComponent } from "./PriceBarChartComponent";
import { PriceBarChartSettingsEditor } from "./PriceBarChartSettingsEditor";

export const PriceBarChart: PanelPlugin<
  PriceBarChartOptions,
  PriceBarChartProps
> = {
  PanelComponent: PriceBarChartComponent,
  panelOptionsEditorComponents: [
    { label: "Settings", content: PriceBarChartSettingsEditor },
  ],
  supportedQueryTypes: ["TimeSeriesQuery"],
  createInitialOptions: createInitialPriceBarChartOptions,
};
