// eslint-disable-next-line barrel/avoid-importing-barrel-files
import { describe, expect, it } from "vitest";

import { MarkdownGenerator } from "../src/markdown-generator.ts";

describe("lists", () => {
  it("should create unordered list recursively", () => {
    const md = new MarkdownGenerator();

    md.unorderedList([
      "Level One",
      ["Level Two", "Level Two"],
      "Still One",
      ["Back to Two",
        ["Level 3"]],
    ]);

    const expected = `* Level One
\t* Level Two
\t* Level Two
* Still One
\t* Back to Two
\t\t* Level 3
`;

    expect(md.render()).toBe(expected);
  });
});
