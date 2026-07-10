import { render } from "@testing-library/react";
import { Effect } from "effect";
import some from "lodash/some.js";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { SourceIcon } from "./source-icon.tsx";

const SVG_TAG = "svg";
const IMG_TAG = "img";
const YOUTUBE_RED_FILL = "#FF0000";
const SIZE_4_CLASS = "size-4";
const YOUTUBE_WATCH_LINK = "https://www.youtube.com/watch?v=abc";
const HACKER_NEWS_LINK = "https://news.ycombinator.com/";
const EXAMPLE_FAVICON = "https://example.com/favicon.ico";
const EXPECTED_NEWSPAPER = "newspaper";
const EXPECTED_YOUTUBE = "youtube";
const EXPECTED_IMG_ERROR = "expected img element to be present";
const EXPECTED_SVG_ERROR = "expected svg element to be present";

const hasYouTubeRedFill = (svg: SVGSVGElement) => {
  return some([...svg.querySelectorAll("path")], (path) => {
    return path.getAttribute("fill") === YOUTUBE_RED_FILL;
  });
};

describe("SourceIcon", () => {
  it.each([
    {
      expected: EXPECTED_YOUTUBE,
      label: "renders YoutubeIcon for www.youtube.com watch links",
      link: YOUTUBE_WATCH_LINK
    },
    {
      expected: EXPECTED_YOUTUBE,
      label: "renders YoutubeIcon for m.youtube.com shorts links",
      link: "https://m.youtube.com/shorts/xyz"
    },
    {
      expected: EXPECTED_NEWSPAPER,
      label: "renders Newspaper for non-YouTube domains",
      link: HACKER_NEWS_LINK
    },
    {
      expected: EXPECTED_NEWSPAPER,
      label: "renders Newspaper for example.com links",
      link: "https://www.example.com/article"
    },
    {
      expected: EXPECTED_NEWSPAPER,
      label: "renders Newspaper for an empty link as a default fallback",
      link: ""
    },
    {
      expected: EXPECTED_NEWSPAPER,
      label:
        "renders Newspaper when link contains 'youtubex' but not 'youtube.com'",
      link: "https://youtubex.com"
    }
  ])("$label", ({ expected, link }) => {
    const { container } = render(<SourceIcon link={link} />);
    const svg = container.querySelector(SVG_TAG);
    if (null === svg) {
      Effect.runSync(Effect.die(new Error(EXPECTED_SVG_ERROR)));
      return;
    }
    if (EXPECTED_YOUTUBE === expected) {
      expect(hasYouTubeRedFill(svg)).toBe(true);
    } else {
      expect(hasYouTubeRedFill(svg)).toBe(false);
    }
  });

  it.each([
    { label: "YoutubeIcon", link: YOUTUBE_WATCH_LINK },
    { label: "Newspaper", link: HACKER_NEWS_LINK }
  ])("forwards className to the rendered svg ($label)", ({ link }) => {
    const { container } = render(
      <SourceIcon link={link} className={SIZE_4_CLASS} />
    );
    const svg = container.querySelector(SVG_TAG);
    if (null === svg) {
      Effect.runSync(Effect.die(new Error(EXPECTED_SVG_ERROR)));
      return;
    }
    expect(svg.getAttribute("class")).toContain(SIZE_4_CLASS);
  });
});

describe("SourceIcon with iconUrl", () => {
  it.each([
    {
      iconUrl: EXAMPLE_FAVICON,
      label: "renders an img for a non-YouTube link with iconUrl",
      link: "https://example.com/article"
    },
    {
      iconUrl: "https://hn.com/favicon.png",
      label: "renders an img for a Hacker News style link with iconUrl",
      link: HACKER_NEWS_LINK
    },
    {
      iconUrl: EXAMPLE_FAVICON,
      label: "renders an img when link is empty but iconUrl is provided",
      link: ""
    }
  ])("$label", ({ iconUrl, link }) => {
    const { container } = render(<SourceIcon link={link} iconUrl={iconUrl} />);
    const img = container.querySelector(IMG_TAG);
    if (null === img) {
      Effect.runSync(Effect.die(new Error(EXPECTED_IMG_ERROR)));
      return;
    }
    expect(img.getAttribute("src")).toBe(iconUrl);
    expect(img.getAttribute("alt")).toBe("");
  });

  it.each([
    {
      iconUrl: EXAMPLE_FAVICON,
      label: "YoutubeIcon wins over iconUrl for www.youtube.com watch links",
      link: YOUTUBE_WATCH_LINK
    },
    {
      iconUrl: EXAMPLE_FAVICON,
      label: "YoutubeIcon wins over iconUrl for m.youtube.com shorts links",
      link: "https://m.youtube.com/shorts/xyz"
    }
  ])("$label", ({ iconUrl, link }) => {
    const { container } = render(<SourceIcon link={link} iconUrl={iconUrl} />);
    const svg = container.querySelector(SVG_TAG);
    if (null === svg) {
      Effect.runSync(Effect.die(new Error(EXPECTED_SVG_ERROR)));
      return;
    }
    expect(hasYouTubeRedFill(svg)).toBe(true);
    expect(container.querySelector(IMG_TAG)).toBeNull();
  });

  it.each([
    {
      iconUrl: null,
      label:
        "renders YoutubeIcon when iconUrl is undefined and link is YouTube",
      link: YOUTUBE_WATCH_LINK
    },
    {
      iconUrl: null,
      label: "renders YoutubeIcon when iconUrl is null and link is YouTube",
      link: YOUTUBE_WATCH_LINK
    },
    {
      iconUrl: "",
      label: "renders YoutubeIcon when iconUrl is empty and link is YouTube",
      link: YOUTUBE_WATCH_LINK
    }
  ])("$label", ({ iconUrl, link }) => {
    const { container } = render(<SourceIcon link={link} iconUrl={iconUrl} />);
    const svg = container.querySelector(SVG_TAG);
    if (null === svg) {
      Effect.runSync(Effect.die(new Error(EXPECTED_SVG_ERROR)));
      return;
    }
    expect(hasYouTubeRedFill(svg)).toBe(true);
  });

  it.each([
    {
      iconUrl: null,
      label:
        "renders Newspaper when iconUrl is undefined and link is non-YouTube",
      link: HACKER_NEWS_LINK
    },
    {
      iconUrl: null,
      label: "renders Newspaper when iconUrl is null and link is non-YouTube",
      link: HACKER_NEWS_LINK
    },
    {
      iconUrl: "",
      label: "renders Newspaper when iconUrl is empty and link is non-YouTube",
      link: HACKER_NEWS_LINK
    }
  ])("$label", ({ iconUrl, link }) => {
    const { container } = render(<SourceIcon link={link} iconUrl={iconUrl} />);
    const img = container.querySelector(IMG_TAG);
    expect(img).toBeNull();
    const svg = container.querySelector(SVG_TAG);
    if (null === svg) {
      Effect.runSync(Effect.die(new Error(EXPECTED_SVG_ERROR)));
      return;
    }
    expect(hasYouTubeRedFill(svg)).toBe(false);
  });

  it("forwards className to the rendered img", () => {
    const { container } = render(
      <SourceIcon
        iconUrl={EXAMPLE_FAVICON}
        className="size-4 shrink-0"
        link="https://example.com/article"
      />
    );
    const img = container.querySelector(IMG_TAG);
    if (null === img) {
      Effect.runSync(Effect.die(new Error(EXPECTED_IMG_ERROR)));
      return;
    }
    expect(img.getAttribute("class")).toContain("size-4");
    expect(img.getAttribute("class")).toContain("shrink-0");
  });

  it("uses alt='' for the img (decorative)", () => {
    const { container } = render(
      <SourceIcon
        iconUrl={EXAMPLE_FAVICON}
        link="https://example.com/article"
      />
    );
    const img = container.querySelector(IMG_TAG);
    if (null === img) {
      Effect.runSync(Effect.die(new Error(EXPECTED_IMG_ERROR)));
      return;
    }
    expect(img.getAttribute("alt")).toBe("");
  });
});
