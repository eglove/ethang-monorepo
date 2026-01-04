import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import map from "lodash/map.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = map([r, g, b], (v) => {
    const value = v / 255;
    return 0.039_28 >= value ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const parseRgba = (rgba: string): [number, number, number, number] => {
  const match =
    /rgba?\((?<r>\d+),\s*(?<g>\d+),\s*(?<b>\d+)(?:,\s*(?<a>[\d.]+))?\)/u.exec(
      rgba,
    );
  if (match?.groups === undefined) return [0, 0, 0, 1];

  return [
    Number.parseInt(match.groups["r"] ?? "0", 10),
    Number.parseInt(match.groups["g"] ?? "0", 10),
    Number.parseInt(match.groups["b"] ?? "0", 10),
    match.groups["a"] === undefined ? 1 : Number.parseFloat(match.groups["a"]),
  ];
};

const parseHex = (hex: string): [number, number, number] => {
  const match = /^#?(?<r>[\da-f]{2})(?<g>[\da-f]{2})(?<b>[\da-f]{2})$/iu.exec(
    hex,
  );
  if (match?.groups === undefined) return [0, 0, 0];

  return [
    Number.parseInt(match.groups["r"] ?? "0", 16),
    Number.parseInt(match.groups["g"] ?? "0", 16),
    Number.parseInt(match.groups["b"] ?? "0", 16),
  ];
};

const blendRgbaOnBackground = (
  rgba: [number, number, number, number],
  bg: [number, number, number],
): [number, number, number] => {
  const [r, g, b, a] = rgba;
  const [br, bg1, bb] = bg;
  return [
    Math.round(r * a + br * (1 - a)),
    Math.round(g * a + bg1 * (1 - a)),
    Math.round(b * a + bb * (1 - a)),
  ];
};

describe("Blog Post Contrast Verification", () => {
  const blogDirectory = path.resolve(process.cwd(), "public/blog");
  const htmlFiles = filter(readdirSync(blogDirectory), (file) => {
    return endsWith(file, ".html");
  });

  it.each(htmlFiles)(
    "should have sufficient contrast for .back-to-top:hover in %s",
    (file) => {
      const filePath = path.join(blogDirectory, file);
      const content = readFileSync(filePath, "utf8");

      const backToTopHoverMatch =
        /\.back-to-top:hover\s*\{(?<styles>[^}]*)\}/u.exec(content);
      if (backToTopHoverMatch?.groups === undefined) {
        return;
      }

      const hoverStyles = backToTopHoverMatch.groups["styles"] ?? "";
      const colorMatch = /color:\s*(?<color>[^;]+)/u.exec(hoverStyles);
      const backgroundMatch =
        /background-color:\s*(?<backgroundColor>[^;]+)/u.exec(hoverStyles) ??
        /background:\s*(?<background>[^;]+)/u.exec(hoverStyles);

      expect(colorMatch).not.toBeNull();
      expect(backgroundMatch).not.toBeNull();

      if (
        colorMatch?.groups === undefined ||
        backgroundMatch?.groups === undefined
      ) {
        return;
      }

      const colorValue = trim(colorMatch.groups["color"] ?? "#ffffff");
      const backgroundValue = trim(
        backgroundMatch.groups["backgroundColor"] ??
          backgroundMatch.groups["background"] ??
          "rgba(0,0,0,1)",
      );

      const rootMatch = /:root\s*\{(?<styles>[^}]*)\}/u.exec(content);
      const rootStyles = rootMatch?.groups?.["styles"] ?? "";
      const bgColorMatch =
        /--bg:\s*(?<bg>[^;]+)/u.exec(rootStyles) ??
        /background:\s*(?<background>[^;]+)/u.exec(content);

      const bgVariable = bgColorMatch?.groups?.["bg"];
      const backgroundVariable = bgColorMatch?.groups?.["background"];

      const baseBgValue = trim(bgVariable ?? backgroundVariable ?? "#000000");

      const baseBgRgb = startsWith(baseBgValue, "#")
        ? parseHex(baseBgValue)
        : ([7, 15, 28] as [number, number, number]);

      const foregroundRgb = startsWith(colorValue, "#")
        ? parseHex(colorValue)
        : ([255, 255, 255] as [number, number, number]);
      const overlayRgba = parseRgba(backgroundValue);
      const blendedBackgroundRgb = blendRgbaOnBackground(
        overlayRgba,
        baseBgRgb,
      );

      const l1 = getLuminance(
        get(foregroundRgb, 0, 0),
        get(foregroundRgb, 1, 0),
        get(foregroundRgb, 2, 0),
      );
      const l2 = getLuminance(
        get(blendedBackgroundRgb, 0, 0),
        get(blendedBackgroundRgb, 1, 0),
        get(blendedBackgroundRgb, 2, 0),
      );

      const ratio = getContrastRatio(l1, l2);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
