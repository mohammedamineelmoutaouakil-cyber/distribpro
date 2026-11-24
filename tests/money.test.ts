import { describe, expect, it } from "vitest";
import { parseMADToCentimes, centimesToInput } from "@/lib/money";

describe("money", () => {
  it("parses common French/Moroccan formats", () => {
    expect(parseMADToCentimes("349.00")).toBe(34900);
    expect(parseMADToCentimes("349,00")).toBe(34900);
    expect(parseMADToCentimes("1 250,50")).toBe(125050);
    expect(parseMADToCentimes("1.250,50")).toBe(125050);
    expect(parseMADToCentimes("1,250.50")).toBe(125050);
    expect(parseMADToCentimes(12.5)).toBe(1250);
  });

  it("rejects invalid amounts", () => {
    expect(parseMADToCentimes("")).toBeNull();
    expect(parseMADToCentimes("abc")).toBeNull();
    expect(parseMADToCentimes("-10")).toBeNull();
    expect(parseMADToCentimes("1.2.3")).toBeNull();
  });

  it("formats centimes for inputs", () => {
    expect(centimesToInput(34900)).toBe("349.00");
    expect(centimesToInput(null)).toBe("");
  });
});
