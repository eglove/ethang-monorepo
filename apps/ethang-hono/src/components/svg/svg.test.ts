import { describe, expect, it } from "vitest";

import { ArrowUpRightSvg } from "./arrow-up-right.tsx";
import { ArrowUpSvg } from "./arrow-up.tsx";
import { ChevronDownSvg } from "./chevron-down.tsx";
import { ChevronUpSvg } from "./chevron-up.tsx";
import { EmailSvg } from "./email.tsx";
import { GitHubSvg } from "./github.tsx";
import { LinkedInSvg } from "./linked-in.tsx";

const expectSvg = (html: string) => {
  expect(html).toContain("<svg");
  expect(html).toContain("</svg>");
};

describe("ArrowUpRightSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await ArrowUpRightSvg({})));
  });
});

describe("ArrowUpSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await ArrowUpSvg({})));
  });
});

describe("ChevronDownSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await ChevronDownSvg({})));
  });
});

describe("ChevronUpSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await ChevronUpSvg({})));
  });
});

describe("EmailSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await EmailSvg({})));
  });
});

describe("GitHubSvg", () => {
  it("renders an SVG element with default dimensions", async () => {
    const html = String(await GitHubSvg({}));
    expectSvg(html);
    expect(html).toContain('width="24"');
    expect(html).toContain('height="24"');
  });

  it("accepts custom width and height", async () => {
    const html = String(await GitHubSvg({ height: "32", width: "32" }));
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });
});

describe("LinkedInSvg", () => {
  it("renders an SVG element", async () => {
    expectSvg(String(await LinkedInSvg({})));
  });
});
