import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy classes with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn(false, null, undefined)).toBe("");
  });

  it("keeps the order of truthy classes", () => {
    expect(cn("z", "y", "", "x")).toBe("z y x");
  });
});
