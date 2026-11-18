import { MouseEvent, ReactElement, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { formatValue } from "@perses-dev/components";
import { Bar, buildModel, darken } from "./data";
import {
  DEFAULT_AVERAGE_LABEL,
  DEFAULT_BANDS,
  DEFAULT_CATEGORY_LABEL,
  DEFAULT_FORMAT,
  PriceBarChartProps,
} from "./price-bar-chart-types";
import { linear, niceTicks } from "./scale";

const MARGIN = { top: 8, right: 4, bottom: 34, left: 40 };
const LEGEND_HEIGHT = 24;
const TOOLTIP_WIDTH = 210;
const LABEL_WIDTH = 38;
const BAR_FILL = 0.72;
/** How much darker the current bar is than its band colour. */
const CURRENT_DARKEN = 0.38;

function hourLabel(bar: Bar): string {
  if (bar.start === undefined) return bar.category;
  const d = new Date(bar.start);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "−25 % vs average, saves 25 %" for a bar at 75 % of the average. */
export function versusAverage(percent: number, averageLabel: string): string {
  const diff = Math.round(percent - 100);
  if (diff === 0) return `at the ${averageLabel}`;
  const sign = diff > 0 ? "+" : "\u2212";
  const change = diff < 0 ? `saves ${-diff} %` : `costs ${diff} % more`;
  return `${sign}${Math.abs(diff)} % vs ${averageLabel}, ${change}`;
}

function dayLabel(start: number): string {
  return new Date(start).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dayOf(bar: Bar | undefined): string | undefined {
  if (bar?.start === undefined) return undefined;
  return new Date(bar.start).toDateString();
}

function Swatch({
  color,
  dashed,
}: {
  color: string;
  dashed?: boolean;
}): ReactElement {
  return dashed ? (
    <svg width={16} height={8} aria-hidden>
      <line
        x1={0}
        y1={4}
        x2={16}
        y2={4}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 3"
      />
    </svg>
  ) : (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 12,
        height: 12,
        borderRadius: "2px",
        backgroundColor: color,
      }}
    />
  );
}

export function PriceBarChartComponent(
  props: PriceBarChartProps,
): ReactElement | null {
  const { queryResults, spec, contentDimensions } = props;
  const theme = useTheme();
  const [hover, setHover] = useState<
    { index: number; px: number; py: number } | undefined
  >();

  const format = spec.format ?? DEFAULT_FORMAT;
  const bands = spec.bands?.length ? spec.bands : DEFAULT_BANDS;
  const showAverage = spec.average?.show ?? true;
  const averageLabel = spec.average?.label || DEFAULT_AVERAGE_LABEL;
  const highlightCurrent = spec.highlightCurrent ?? true;

  const model = useMemo(
    () =>
      buildModel(queryResults, {
        categoryLabel: spec.categoryLabel || DEFAULT_CATEGORY_LABEL,
        bands,
        now: Date.now(),
      }),
    [queryResults, spec.categoryLabel, bands],
  );

  if (contentDimensions === undefined) return null;
  const { width, height } = contentDimensions;
  const showLegend = spec.legend !== undefined;
  const plotHeight = Math.max(0, height - (showLegend ? LEGEND_HEIGHT : 0));

  if (model.bars.length === 0) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">No data</Typography>
      </Box>
    );
  }

  const { bars, average } = model;
  const current = highlightCurrent ? model.current : undefined;
  const max = Math.max(0, ...bars.map((b) => b.value));
  const min = Math.min(0, ...bars.map((b) => b.value));
  const ticks = niceTicks(min, max * 1.05, 5);
  const yd: [number, number] = [
    Math.min(min, ticks[0] ?? min),
    Math.max(max, ticks[ticks.length - 1] ?? max),
  ];
  const fmt = (v: number): string => formatValue(v, format);
  // Room for the widest y label ("1.50 kr/kWh"), at about 6.5 px per character of 11 px text.
  const left = Math.max(
    MARGIN.left,
    Math.ceil(Math.max(...ticks.map((t) => fmt(t).length)) * 6.5) + 10,
  );
  const right = width - MARGIN.right;
  const top = MARGIN.top;
  const bottom = plotHeight - MARGIN.bottom;
  const y = linear(yd, [bottom, top]);
  const slot = (right - left) / bars.length;
  const barWidth = Math.max(1, slot * BAR_FILL);
  const slotX = (i: number): number => left + i * slot;
  const labelEvery = Math.max(1, Math.ceil(LABEL_WIDTH / slot));

  const text = theme.palette.text.secondary;
  const grid = theme.palette.divider;
  const columnFill = theme.palette.text.primary;
  const averageColor = theme.palette.text.secondary;

  const onMove = (e: MouseEvent<SVGRectElement>): void => {
    const box = (
      e.currentTarget.ownerSVGElement ?? e.currentTarget
    ).getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    const index = Math.min(
      bars.length - 1,
      Math.max(0, Math.floor((px - left) / slot)),
    );
    setHover({ index, px, py });
  };

  const hovered = hover ? bars[hover.index] : undefined;
  const tooltipLeft = hover
    ? hover.px + 14 + TOOLTIP_WIDTH > width
      ? Math.max(0, hover.px - 14 - TOOLTIP_WIDTH)
      : hover.px + 14
    : 0;

  return (
    <Box sx={{ position: "relative", width, height }}>
      <svg
        width={width}
        height={plotHeight}
        role="img"
        aria-label={`${bars.length} bars${average !== undefined ? `, ${averageLabel} ${fmt(average)}` : ""}`}
        style={{ display: "block" }}
      >
        {ticks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={left}
              x2={right}
              y1={y(t)}
              y2={y(t)}
              stroke={grid}
              strokeWidth={1}
            />
            <text
              x={left - 6}
              y={y(t)}
              fill={text}
              fontSize={11}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {fmt(t)}
            </text>
          </g>
        ))}

        {current !== undefined && (
          <rect
            data-testid="current-column"
            x={slotX(current)}
            y={top}
            width={slot}
            height={bottom - top}
            fill={columnFill}
            fillOpacity={0.12}
          />
        )}
        {hover !== undefined && hover.index !== current && (
          <rect
            data-testid="hover-column"
            x={slotX(hover.index)}
            y={top}
            width={slot}
            height={bottom - top}
            fill={columnFill}
            fillOpacity={0.06}
            pointerEvents="none"
          />
        )}

        {bars.map((bar, i) => {
          const isDayStart = i > 0 && dayOf(bar) !== dayOf(bars[i - 1]);
          const y0 = y(Math.max(0, bar.value));
          const y1 = y(Math.min(0, bar.value));
          return (
            <g key={bar.category}>
              {isDayStart && (
                <line
                  x1={slotX(i)}
                  x2={slotX(i)}
                  y1={top}
                  y2={bottom + 30}
                  stroke={grid}
                  strokeWidth={1}
                />
              )}
              <rect
                data-testid="bar"
                data-category={bar.category}
                x={slotX(i) + (slot - barWidth) / 2}
                y={y0}
                width={barWidth}
                height={Math.max(0, y1 - y0)}
                fill={
                  i === current
                    ? darken(bar.band.color, CURRENT_DARKEN)
                    : bar.band.color
                }
                rx={1}
              />
              {i % labelEvery === 0 && (
                <text
                  x={slotX(i) + slot / 2}
                  y={bottom + 13}
                  fill={text}
                  fontSize={11}
                  fontWeight={i === current ? 700 : 400}
                  textAnchor="middle"
                >
                  {hourLabel(bar)}
                </text>
              )}
              {bar.start !== undefined && (i === 0 || isDayStart) && (
                <text
                  x={slotX(i) + 2}
                  y={bottom + 28}
                  fill={text}
                  fontSize={11}
                  textAnchor="start"
                >
                  {dayLabel(bar.start)}
                </text>
              )}
            </g>
          );
        })}

        {showAverage && average !== undefined && (
          <line
            data-testid="average-line"
            x1={left}
            x2={right}
            y1={y(average)}
            y2={y(average)}
            stroke={averageColor}
            strokeOpacity={0.8}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            pointerEvents="none"
          />
        )}

        <rect
          data-testid="hover-target"
          x={left}
          y={top}
          width={Math.max(0, right - left)}
          height={Math.max(0, bottom - top)}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(undefined)}
        />
      </svg>

      {showLegend && (
        <Box
          sx={{
            height: LEGEND_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 1.5,
            overflow: "hidden",
          }}
        >
          {bands.map((b) => (
            <Box
              key={b.label}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Swatch color={b.color} />
              <Typography variant="caption">{b.label}</Typography>
            </Box>
          ))}
          {showAverage && average !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Swatch color={averageColor} dashed />
              <Typography variant="caption">{`${averageLabel} ${fmt(average)}`}</Typography>
            </Box>
          )}
        </Box>
      )}

      {hover !== undefined && hovered !== undefined && (
        <Box
          role="tooltip"
          sx={{
            position: "absolute",
            left: tooltipLeft,
            top: Math.max(0, Math.min(hover.py - 20, plotHeight - 120)),
            width: TOOLTIP_WIDTH,
            p: 1,
            pointerEvents: "none",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: 3,
            zIndex: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" component="div">
            {hovered.category}
            {hover.index === current ? " (now)" : ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Swatch
              color={
                hover.index === current
                  ? darken(hovered.band.color, CURRENT_DARKEN)
                  : hovered.band.color
              }
            />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {hovered.band.label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {fmt(hovered.value)}
            </Typography>
          </Box>
          {average !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Swatch color={averageColor} dashed />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {averageLabel}
              </Typography>
              <Typography variant="body2">{fmt(average)}</Typography>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" component="div">
            {versusAverage(hovered.percent, averageLabel)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
