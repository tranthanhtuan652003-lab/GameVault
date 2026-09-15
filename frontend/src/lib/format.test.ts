import { describe, expect, it } from "vitest";
import { formatPrice, formatCompactPrice, formatRating, formatDate, formatDateTime } from "./format";

describe("formatPrice", () => {
  it("formats whole numbers without decimals", () => {
    const out = formatPrice(1500000);
    expect(out).toContain("1.500.000");
    expect(out).toContain("₫");
  });

  it("formats decimals rounded to whole VND", () => {
    const out = formatPrice(299000);
    expect(out).toContain("299.000");
    expect(out).toContain("₫");
  });
});

describe("formatCompactPrice", () => {
  it("formats whole numbers in VND", () => {
    expect(formatCompactPrice(1500000)).toContain("1.500.000");
    expect(formatCompactPrice(1500000)).toContain("₫");
  });

  it("formats sub-thousand VND values", () => {
    expect(formatCompactPrice(500000)).toContain("500.000");
  });

  it("renders without US$ symbol", () => {
    expect(formatCompactPrice(299000)).not.toContain("$");
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
