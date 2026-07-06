import { render } from "@testing-library/react";
import toLower from "lodash/toLower";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { YoutubeIcon } from "./youtube-icon.tsx";

const YOUTUBE_ICON_TEST_ID = "youtube-icon";
const YOUTUBE_ICON_LABEL = "YouTube";
const SVG_TAG = "svg";

describe("YoutubeIcon", () => {
  it.each([
    {
      check: (svg: SVGSVGElement) => {
        expect(toLower(svg.tagName)).toBe(SVG_TAG);
      },
      label: "renders an svg element",
      props: {}
    },
    {
      check: (svg: SVGSVGElement) => {
        expect(svg.getAttribute("class")).toBe("size-4");
      },
      label: "forwards className to the svg",
      props: { className: "size-4" }
    },
    {
      check: (svg: SVGSVGElement) => {
        expect(svg.dataset["testid"]).toBe(YOUTUBE_ICON_TEST_ID);
      },
      label: "forwards data-testid to the svg",
      props: { "data-testid": YOUTUBE_ICON_TEST_ID }
    },
    {
      check: (svg: SVGSVGElement) => {
        expect(svg.getAttribute("aria-label")).toBe(YOUTUBE_ICON_LABEL);
      },
      label: "forwards aria-label to the svg",
      props: { "aria-label": YOUTUBE_ICON_LABEL }
    },
    {
      check: (svg: SVGSVGElement) => {
        expect(svg.getAttribute("width")).toBeTruthy();
        expect(svg.getAttribute("height")).toBeTruthy();
      },
      label: "renders with default width and height attributes",
      props: {}
    }
  ])("$label", ({ check, props }) => {
    const { container } = render(<YoutubeIcon {...props} />);
    const svg = container.querySelector(SVG_TAG);
    if (svg) {
      check(svg);
    } else {
      throw new Error("expected svg element to be present");
    }
  });
});
