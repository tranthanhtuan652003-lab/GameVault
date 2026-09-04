import { describe, expect, it } from "vitest";
import { formatPrice, formatCompactPrice, formatRating, formatDate, formatDateTime } from "./format";

describe("formatPrice", () => {
  it("formats whole numbers without decimals", () => {
    const out = formatPrice(60);
    expect(out).toContain("60");
    expect(out).toContain("US$");
  });

  it("formats decimals with two places", () => {
    const out = formatPrice(29.99);
    expect(out).toContain("29,99");
    expect(out).toContain("US$");
  });
});

describe("formatCompactPrice", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatCompactPrice(120)).toBe("$120");
  });

  it("formats sub-dollar values with two places", () => {
    expect(formatCompactPrice(0.5)).toBe("$0.50");
  });

  it("keeps two decimals for non-integers", () => {
    expect(formatCompactPrice(29.99)).toBe("$29.99");
  });
});

describe("formatRating", () => {
  it("always shows one decimal", () => {
    expect(formatRating(4.5)).toBe("4.5");
    expect(formatRating(4)).toBe("4.0");
  });
});

describe("formatDate", () => {
  it("returns N/A for null/undefined/empty", () => {
    expect(formatDate(null)).toBe("N/A");
    expect(formatDate(undefined)).toBe("N/A");
    expect(formatDate("")).toBe("N/A");
  });

  it("returns N/A for an invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("N/A");
  });

  it("formats a valid ISO date", () => {
    expect(formatDate("2024-01-15T00:00:00Z")).toBe("15/01/2024");
  });
});

describe("formatDateTime", () => {
  it("returns N/A for null", () => {
    expect(formatDateTime(null)).toBe("N/A");
  });

  it("formats a valid ISO datetime with local time", () => {
    const out = formatDateTime("2024-05-20T14:30:00Z");
    expect(out).toContain("20/05/2024");
    // time rendered in the local timezone, e.g. "14:30" or "21:30"
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});
