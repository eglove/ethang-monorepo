import { describe, expect, it } from "vitest";
import { portableTextToMdx } from "./portableTextToMdx.ts";

const resolveImage = (url: string | undefined) => (url ? "./images/x.png" : null);

describe("portableTextToMdx", () => {
  it("converts a heading, paragraph, and inline decorators", () => {
    const { body } = portableTextToMdx(
      [
        { _type: "block", style: "h2", children: [{ text: "Hello" }] },
        { _type: "block", style: "normal",
          children: [{ text: "bold " }, { text: "x", marks: ["strong"] }, { text: " link", marks: [] }],
          markDefs: [{ _key: "k1", _type: "link", href: "/about" }] }
      ],
      resolveImage
    );
    expect(body).toBe("## Hello\n\n**x**\n\n");
  });
});