import { fireEvent, render, screen } from "@testing-library/react";
import { hours, results } from "../../test-utils/fixtures";
import {
  PriceBarChartComponent,
  versusAverage,
} from "./PriceBarChartComponent";
import {
  PriceBarChartOptions,
  PriceBarChartProps,
} from "./price-bar-chart-types";

const SPEC: PriceBarChartOptions = {
  format: { unit: "decimal", decimalPlaces: 2 },
  legend: { position: "bottom" },
};

function renderPanel(
  queryResults: PriceBarChartProps["queryResults"],
  spec: PriceBarChartOptions = SPEC,
): ReturnType<typeof render> {
  return render(
    <PriceBarChartComponent
      spec={spec}
      queryResults={queryResults}
      contentDimensions={{ width: 900, height: 300 }}
    />,
  );
}

describe("PriceBarChartComponent", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 18, 2, 15));
  });
  afterEach(() => jest.useRealTimers());

  it("says there is no data for empty results", () => {
    renderPanel([]);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("draws a bar per hour coloured by band, with the current one darker", () => {
    renderPanel(results(hours("2026-11-18", [1, 2, 3, 6])));
    const bars = screen.getAllByTestId("bar");
    expect(bars).toHaveLength(4);
    // average 3: 33 %, 67 %, 100 %, 200 %
    expect(bars[0]).toHaveAttribute("fill", "#3274d9");
    expect(bars[1]).toHaveAttribute("fill", "#3274d9");
    expect(bars[2]).toHaveAttribute("fill", "#1d6231");
    expect(bars[3]).toHaveAttribute("fill", "#c8372d");
    expect(screen.getByTestId("current-column")).toBeInTheDocument();
  });

  it("draws the average as a dashed line that ignores the mouse", () => {
    renderPanel(results(hours("2026-11-18", [1, 2, 3, 6])));
    const line = screen.getByTestId("average-line");
    expect(line).toHaveAttribute("stroke-dasharray", "6 4");
    expect(line).toHaveAttribute("pointer-events", "none");
    expect(screen.getByText("average 3.00")).toBeInTheDocument();
  });

  it("hides the average line and the highlight when turned off", () => {
    renderPanel(results(hours("2026-11-18", [1, 2, 3, 6])), {
      ...SPEC,
      average: { show: false },
      highlightCurrent: false,
    });
    expect(screen.queryByTestId("average-line")).not.toBeInTheDocument();
    expect(screen.queryByTestId("current-column")).not.toBeInTheDocument();
  });

  it("shows the price, band and average when hovering a bar", () => {
    renderPanel(results(hours("2026-11-18", [1, 2, 3, 6])));
    const target = screen.getByTestId("hover-target");
    // 4 slots over x 40..896; x 800 is the last one.
    fireEvent.mouseMove(target, { clientX: 800, clientY: 100 });
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("2026-11-18 03:00");
    expect(tooltip).toHaveTextContent("high");
    expect(tooltip).toHaveTextContent("6.00");
    expect(tooltip).toHaveTextContent("average3.00");
    expect(tooltip).toHaveTextContent("+100 % vs average, costs 100 % more");
    expect(tooltip).not.toHaveTextContent("very cheap");
    expect(screen.getByTestId("hover-column")).toBeInTheDocument();
    fireEvent.mouseLeave(target);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("marks the current hour in its tooltip", () => {
    renderPanel(results(hours("2026-11-18", [1, 2, 3, 6])));
    fireEvent.mouseMove(screen.getByTestId("hover-target"), {
      clientX: 500,
      clientY: 100,
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "2026-11-18 02:00 (now)",
    );
  });
});

describe("versusAverage", () => {
  it("says how much an hour saves or costs against the average", () => {
    expect(versusAverage(75, "average")).toBe(
      "\u221225 % vs average, saves 25 %",
    );
    expect(versusAverage(112.4, "average")).toBe(
      "+12 % vs average, costs 12 % more",
    );
    expect(versusAverage(100.2, "average")).toBe("at the average");
  });
});
