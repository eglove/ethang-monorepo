import { resolveThemeTokens } from "@astryxdesign/core/theme/tokens";
import { describe, expect, it } from "vitest";

import { nightowlTheme } from "./nightowl.ts";

const dark = resolveThemeTokens(nightowlTheme, { mode: "dark" });
const light = resolveThemeTokens(nightowlTheme, { mode: "light" });

describe("nightowlTheme", () => {
  it("is named nightowl", () => {
    expect(nightowlTheme.name).toBe("nightowl");
  });

  it.each([
    ["--color-background-body", "#011627"],
    ["--color-background-surface", "#0b2942"],
    ["--color-text-primary", "#d6deeb"],
    ["--color-text-secondary", "#637777"],
    ["--color-accent", "#7fdbca"],
    ["--color-border", "#1d3b53"]
  ])("resolves %s to Night Owl value %s in dark mode", (token, expected) => {
    expect(dark[token]).toBe(expected);
  });

  it.each([
    "--color-background-body",
    "--color-accent",
    "--color-text-primary"
  ])(
    "locks %s identically across light and dark slots (dark-only)",
    (token) => {
      expect(light[token]).toBe(dark[token]);
    }
  );

  it.each([
    "--radius-none",
    "--radius-inner",
    "--radius-element",
    "--radius-container",
    "--radius-page"
  ])("sets %s to 0 (razor-sharp rectangular geometry)", (token) => {
    expect(dark[token]).toBe("0");
  });

  it.each(["--shadow-low", "--shadow-med", "--shadow-high"])(
    "uses hard-edged block shadow for %s (zero blur, no inset)",
    (token) => {
      const value = dark[token];
      expect(value).toMatch(/px -?\d+px 0 0/u);
      expect(value).not.toContain("inset");
    }
  );
});
