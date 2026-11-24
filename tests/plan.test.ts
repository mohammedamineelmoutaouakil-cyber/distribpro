import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/constants";
import { planUsageLabel } from "@/lib/plan";

describe("plans", () => {
  it("defines the two commercial plans", () => {
    expect(PLANS.starter.priceMAD).toBe(299);
    expect(PLANS.starter.maxProducts).toBe(300);
    expect(PLANS.starter.maxCustomers).toBe(20);
    expect(PLANS.pro.priceMAD).toBe(599);
    expect(PLANS.pro.maxProducts).toBe(2000);
    expect(PLANS.pro.maxCustomers).toBe(100);
  });

  it("formats usage labels", () => {
    expect(planUsageLabel(10, 20)).toBe("10 / 20");
  });
});
