import { fireEvent, render, screen } from "@testing-library/react";
import { PriceBarChartSettingsEditor } from "./PriceBarChartSettingsEditor";
import { createInitialPriceBarChartOptions } from "./price-bar-chart-types";

describe("PriceBarChartSettingsEditor", () => {
  it("changes a band's upper bound", () => {
    const onChange = jest.fn();
    render(
      <PriceBarChartSettingsEditor
        value={createInitialPriceBarChartOptions()}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getAllByLabelText("Up to %")[0]!, {
      target: { value: "80" },
    });
    expect(onChange.mock.calls[0][0].bands[0].upTo).toBe(80);
  });

  it("turns the average line off", () => {
    const onChange = jest.fn();
    render(
      <PriceBarChartSettingsEditor
        value={createInitialPriceBarChartOptions()}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole("checkbox")[1]!);
    expect(onChange.mock.calls[0][0].average.show).toBe(false);
  });
});
