/**
 * All monetary amounts are stored and manipulated as integer centimes.
 * No floating point arithmetic is used for financial calculations.
 */

const MAD_FORMATTER = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MAD_COMPACT = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMAD(centimes: number | bigint | null | undefined) {
  const value = Number(centimes ?? 0) / 100;
  return MAD_FORMATTER.format(value);
}

export function formatMADCompact(centimes: number | bigint | null | undefined) {
  const value = Number(centimes ?? 0) / 100;
  return MAD_COMPACT.format(value);
}

/** Format a price for an input field: 12500 centimes -> "125.00" */
export function centimesToInput(centimes: number | null | undefined) {
  if (centimes === null || centimes === undefined) return "";
  return (centimes / 100).toFixed(2);
}

/**
 * Parse a user-provided MAD amount into centimes without floating point drift.
 * Accepts "1 250,50", "1250.5", "1.250,50" and rejects ambiguous/invalid input.
 */
export function parseMADToCentimes(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return Math.round(input * 100);
  }

  let value = input.trim().replace(/\s/g, "").replace(/\u00a0/g, "");
  if (!value) return null;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // 1.250,50 -> thousands dot, decimal comma
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      // 1,250.50 -> thousands comma, decimal dot
      value = value.replace(/,/g, "");
    }
  } else if (lastComma > -1) {
    const decimals = value.length - lastComma - 1;
    value = decimals <= 2 ? value.replace(",", ".") : value.replace(/,/g, "");
  } else if (lastDot > -1) {
    const decimals = value.length - lastDot - 1;
    if (decimals === 3 && value.split(".").length === 2) {
      // "1.250" is treated as 1250 (thousands separator)
      value = value.replace(".", "");
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimals = ""] = value.split(".");
  const padded = (decimals + "00").slice(0, 2);
  const centimes = Number(whole) * 100 + Number(padded);
  if (!Number.isSafeInteger(centimes) || centimes < 0) return null;
  return centimes;
}

export function lineTotal(unitPriceCentimes: number, quantity: number) {
  return unitPriceCentimes * quantity;
}
