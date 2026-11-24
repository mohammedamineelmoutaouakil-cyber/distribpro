import { describe, expect, it } from "vitest";
import {
  resolvePrice,
  calculateLine,
  calculateCartTotal,
  isValidQuantity,
} from "@/lib/pricing";

describe("pricing", () => {
  it("applies customer > group > base priority", () => {
    expect(
      resolvePrice({ basePriceCentimes: 1000, groupPriceCentimes: 900, customerPriceCentimes: 800 })
    ).toEqual({ unitPriceCentimes: 800, source: "customer" });

    expect(
      resolvePrice({ basePriceCentimes: 1000, groupPriceCentimes: 900, customerPriceCentimes: null })
    ).toEqual({ unitPriceCentimes: 900, source: "group" });

    expect(
      resolvePrice({ basePriceCentimes: 1000, groupPriceCentimes: null, customerPriceCentimes: undefined })
    ).toEqual({ unitPriceCentimes: 1000, source: "base" });
  });

  it("ignores unsafe or negative prices", () => {
    expect(resolvePrice({ basePriceCentimes: 1000, customerPriceCentimes: -1 })).toEqual({
      unitPriceCentimes: 1000,
      source: "base",
    });
  });

  it("calculates lines and totals without floats", () => {
    expect(calculateLine(34900, 3)).toBe(104700);
    expect(calculateCartTotal([{ unitPriceCentimes: 34900, quantity: 3 }, { unitPriceCentimes: 100, quantity: 2 }])).toBe(
      104900
    );
  });

  it("validates quantities against MOQ", () => {
    expect(isValidQuantity(5, 3)).toBe(true);
    expect(isValidQuantity(2, 3)).toBe(false);
    expect(isValidQuantity(100001, 1)).toBe(false);
  });
});
