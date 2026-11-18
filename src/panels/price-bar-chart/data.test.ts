import { hours, results, series } from "../../test-utils/fixtures";
import { bandFor, buildModel, darken, parseLocalTime } from "./data";
import { DEFAULT_BANDS } from "./price-bar-chart-types";

const OPTIONS = { categoryLabel: "start", bands: DEFAULT_BANDS };

describe("parseLocalTime", () => {
  it("reads a local start time", () => {
    expect(parseLocalTime("2026-11-18 17:00")).toBe(
      new Date(2026, 10, 18, 17, 0).getTime(),
    );
    expect(parseLocalTime("2026-11-18T17:30:15")).toBe(
      new Date(2026, 10, 18, 17, 30, 15).getTime(),
    );
  });

  it("returns undefined for other text", () => {
    expect(parseLocalTime("node-1")).toBeUndefined();
  });
});

describe("bandFor", () => {
  it("takes the first band the percentage does not exceed", () => {
    expect(bandFor(75, DEFAULT_BANDS).label).toBe("very cheap");
    expect(bandFor(75.1, DEFAULT_BANDS).label).toBe("under average");
    expect(bandFor(100, DEFAULT_BANDS).label).toBe("under average");
    expect(bandFor(115, DEFAULT_BANDS).label).toBe("over average");
    expect(bandFor(300, DEFAULT_BANDS).label).toBe("high");
  });

  it("uses the last band when none has room", () => {
    expect(
      bandFor(200, [{ upTo: 100, color: "#000", label: "low" }]).label,
    ).toBe("low");
  });
});

describe("buildModel", () => {
  it("sorts bars by category, sums duplicates and averages", () => {
    const model = buildModel(
      results(
        [
          series("p", { start: "2026-11-18 02:00" }, [[0, 3]]),
          series("p", { start: "2026-11-18 01:00" }, [
            [0, 5],
            [1, 1],
          ]),
        ],
        [series("p", { start: "2026-11-18 02:00" }, [[0, 1]])],
      ),
      { ...OPTIONS, now: 0 },
    );
    expect(model.bars.map((b) => [b.category, b.value])).toEqual([
      ["2026-11-18 01:00", 1],
      ["2026-11-18 02:00", 4],
    ]);
    expect(model.average).toBe(2.5);
    expect(model.bars[0]!.percent).toBe(40);
    expect(model.bars[0]!.band.label).toBe("very cheap");
    expect(model.bars[1]!.band.label).toBe("high");
  });

  it("skips series with only null values", () => {
    const model = buildModel(
      results([series("p", { start: "2026-11-18 01:00" }, [[0, null]])]),
      { ...OPTIONS, now: 0 },
    );
    expect(model.bars).toEqual([]);
    expect(model.average).toBeUndefined();
  });

  it("finds the bar whose hour holds now", () => {
    const data = results(hours("2026-11-18", [1, 2, 3, 4]));
    const at = (h: number, m: number): number =>
      new Date(2026, 10, 18, h, m).getTime();
    expect(buildModel(data, { ...OPTIONS, now: at(2, 30) }).current).toBe(2);
    expect(buildModel(data, { ...OPTIONS, now: at(0, 0) }).current).toBe(0);
    expect(buildModel(data, { ...OPTIONS, now: at(3, 59) }).current).toBe(3);
    expect(
      buildModel(data, { ...OPTIONS, now: at(4, 0) }).current,
    ).toBeUndefined();
    expect(
      buildModel(data, { ...OPTIONS, now: at(0, 0) - 1 }).current,
    ).toBeUndefined();
  });
});

describe("darken", () => {
  it("darkens hex colours toward black", () => {
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#fff", 0)).toBe("#ffffff");
  });

  it("leaves other colours alone", () => {
    expect(darken("red", 0.5)).toBe("red");
  });
});
