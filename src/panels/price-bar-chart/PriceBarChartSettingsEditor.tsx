import { ReactElement } from "react";
import { Box, Button, IconButton, Switch, TextField } from "@mui/material";
import {
  FormatControls,
  OptionsEditorColumn,
  OptionsEditorControl,
  OptionsEditorGrid,
  OptionsEditorGroup,
} from "@perses-dev/components";
import { LegendOptionsEditor } from "@perses-dev/plugin-system";
import {
  DEFAULT_AVERAGE_LABEL,
  DEFAULT_BANDS,
  DEFAULT_CATEGORY_LABEL,
  DEFAULT_FORMAT,
  PriceBand,
  PriceBarChartEditorProps,
  PriceBarChartOptions,
} from "./price-bar-chart-types";

function numberOrUndefined(text: string): number | undefined {
  if (text.trim() === "") return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
}

export function PriceBarChartSettingsEditor(
  props: PriceBarChartEditorProps,
): ReactElement {
  const { onChange, value } = props;
  const set = (patch: Partial<PriceBarChartOptions>): void =>
    onChange({ ...value, ...patch });
  const bands = value.bands?.length ? value.bands : DEFAULT_BANDS;
  const setBand = (i: number, patch: Partial<PriceBand>): void =>
    set({ bands: bands.map((b, j) => (j === i ? { ...b, ...patch } : b)) });

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Bars">
          <OptionsEditorControl
            label="Category label"
            description="Series label naming each bar, a local start time such as 2026-11-18 17:00"
            control={
              <TextField
                size="small"
                placeholder={DEFAULT_CATEGORY_LABEL}
                value={value.categoryLabel ?? ""}
                onChange={(e) =>
                  set({ categoryLabel: e.target.value || undefined })
                }
              />
            }
          />
          <OptionsEditorControl
            label="Highlight current hour"
            description="Darker bar and a background column for the hour holding now"
            control={
              <Switch
                checked={value.highlightCurrent ?? true}
                onChange={(e) => set({ highlightCurrent: e.target.checked })}
              />
            }
          />
          <OptionsEditorControl
            label="Average line"
            description="Dashed line at the average of the shown bars"
            control={
              <Switch
                checked={value.average?.show ?? true}
                onChange={(e) =>
                  set({ average: { ...value.average, show: e.target.checked } })
                }
              />
            }
          />
          <OptionsEditorControl
            label="Average label"
            control={
              <TextField
                size="small"
                placeholder={DEFAULT_AVERAGE_LABEL}
                value={value.average?.label ?? ""}
                onChange={(e) =>
                  set({
                    average: {
                      ...value.average,
                      label: e.target.value || undefined,
                    },
                  })
                }
              />
            }
          />
        </OptionsEditorGroup>
        <OptionsEditorGroup title="Bands (% of the average)">
          {bands.map((band, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                size="small"
                label="Label"
                value={band.label}
                onChange={(e) => setBand(i, { label: e.target.value })}
              />
              <TextField
                size="small"
                label="Up to %"
                placeholder={i === bands.length - 1 ? "rest" : ""}
                value={band.upTo ?? ""}
                onChange={(e) =>
                  setBand(i, { upTo: numberOrUndefined(e.target.value) })
                }
                sx={{ width: 90 }}
              />
              <TextField
                size="small"
                label="Colour"
                value={band.color}
                onChange={(e) => setBand(i, { color: e.target.value })}
                sx={{ width: 110 }}
              />
              <IconButton
                aria-label={`Remove band ${band.label}`}
                size="small"
                disabled={bands.length <= 1}
                onClick={() => set({ bands: bands.filter((_, j) => j !== i) })}
              >
                ×
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            onClick={() =>
              set({ bands: [...bands, { color: "#888888", label: "band" }] })
            }
          >
            Add band
          </Button>
        </OptionsEditorGroup>
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <FormatControls
          value={value.format ?? DEFAULT_FORMAT}
          onChange={(format) => set({ format })}
        />
        <LegendOptionsEditor
          value={value.legend}
          onChange={(legend) => set({ legend })}
        />
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
