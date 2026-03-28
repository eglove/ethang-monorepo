import { describe, expect, it } from "vitest";

import { ArrowUpRightSvg } from "./arrow-up-right.tsx";
import { ArrowUpSvg } from "./arrow-up.tsx";
import { ChevronDownSvg } from "./chevron-down.tsx";
import { ChevronUpSvg } from "./chevron-up.tsx";
import { EmailSvg } from "./email.tsx";
import { GitHubSvg } from "./github.tsx";
import { LinkedInSvg } from "./linked-in.tsx";

const RENDERS_SVG = "renders an SVG element";

describe(ArrowUpRightSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await ArrowUpRightSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});

describe(ArrowUpSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await ArrowUpSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});

describe(ChevronDownSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await ChevronDownSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});

describe(ChevronUpSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await ChevronUpSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});

describe(EmailSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await EmailSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});

describe(GitHubSvg, () => {
  it("renders an SVG element with default dimensions", async () => {
    const html = String(await GitHubSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
    expect(html).toContain('width="24"');
    expect(html).toContain('height="24"');
  });

  it("accepts custom width and height", async () => {
    const html = String(await GitHubSvg({ height: "32", width: "32" }));

    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });
});

describe(LinkedInSvg, () => {
  it(RENDERS_SVG, async () => {
    const html = String(await LinkedInSvg({}));

    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
  });
});
