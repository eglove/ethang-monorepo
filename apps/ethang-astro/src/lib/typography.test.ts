import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(
  new URL("../styles/global.css", import.meta.url),
  "utf8"
);

const typeScale = [
  ["xs", "0.75rem", "1rem"],
  ["sm", "0.875rem", "1.25rem"],
  ["base", "1rem", "1.5rem"],
  ["lg", "1.125rem", "1.75rem"],
  ["xl", "1.25rem", "1.75rem"],
  ["2xl", "1.5rem", "2rem"],
  ["3xl", "1.875rem", "2.25rem"],
  ["4xl", "2.25rem", "2.5rem"]
] as const;

describe("type scale tokens", () => {
  it.each(typeScale)(
    "defines a valid %s font-size and line-height token",
    (name, fontSize, lineHeight) => {
      expect(globalCss).toContain(`--text-${name}: ${fontSize};`);
      expect(globalCss).toContain(
        `--text-${name}--line-height: ${lineHeight};`
      );
    }
  );
});
