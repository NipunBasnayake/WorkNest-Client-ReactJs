import { describe, expect, it } from "vitest";
import {
  deriveBrandTokens,
  hasAccessibleTextContrast,
  isValidBrandColor,
  normalizeBrandColor,
} from "@/features/branding/colorTokens";

describe("tenant brand color tokens", () => {
  it("accepts only strict six-digit hex colors", () => {
    expect(isValidBrandColor("#10A0FF")).toBe(true);
    expect(isValidBrandColor("#fff")).toBe(false);
    expect(isValidBrandColor("10A0FF")).toBe(false);
    expect(normalizeBrandColor("invalid")).toBe("#9332EA");
  });

  it.each(["#FFFFFF", "#000000", "#FFFF00", "#0000FF", "#FF00FF"])(
    "derives an accessible action foreground for %s",
    (color) => {
      const tokens = deriveBrandTokens(color);
      expect(tokens["--tenant-primary"]).toBe(color);
      expect(["#FFFFFF", "#111827"]).toContain(tokens["--brand-on-primary"]);
      expect(hasAccessibleTextContrast(tokens["--brand-action"])).toBe(true);
    }
  );

  it("is deterministic and provides every required semantic alias", () => {
    const first = deriveBrandTokens("#2563EB");
    const second = deriveBrandTokens("#2563EB");
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      "--brand-action": expect.any(String),
      "--brand-action-hover": expect.any(String),
      "--brand-soft": expect.any(String),
      "--brand-border": expect.any(String),
      "--brand-focus": expect.any(String),
    });
  });
});
