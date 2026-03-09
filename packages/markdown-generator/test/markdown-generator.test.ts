import { describe, expect, it } from "vitest";

import { MarkdownGenerator } from "../src/markdown-generator.ts";

describe("lists", () => {
  it("should create unordered list recursively", () => {
    const md = new MarkdownGenerator();

    md.unorderedList([
      "Level One",
      ["Level Two", "Level Two"],
      "Still One",
      ["Back to Two", ["Level 3"]],
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

  it("should render table", () => {
    const md = new MarkdownGenerator();

    md.tableHeader(["Header 1", "Header 2"]);
    md.tableRow(["Cell 1", "Cell 2"]);
    md.tableRow(["Cell 3", "Cell 4"]);

    const expected = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |
`;

    expect(md.render()).toBe(expected);
  });
});
