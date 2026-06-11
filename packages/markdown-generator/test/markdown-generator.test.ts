import { describe, expect, it } from "vitest";

import { MarkdownGenerator } from "../src/markdown-generator.js";

describe("MarkdownGenerator", () => {
  it("should generate basic markdown", () => {
    const generator = new MarkdownGenerator();
    generator.header(1, "Title");
    generator.header(2, "Subtitle");
    generator.text("Paragraph");
    generator.unorderedList(["Item 1", "Item 2"]);
    generator.numberedList(["Item 1", "Item 2"]);
    generator.codeBlock("console.log('Hello, World!');", "javascript");
    generator.quote("Quote");
    generator.bold("Bold");
    generator.italic("Italic");
    generator.strikeThrough("Strikethrough");
    generator.link("Link", "https://ethang.dev/");
    generator.image("Image", "https://ethang.dev/logo.png");
    generator.newLine();
    generator.tableHeader(["Header 1", "Header 2"]);
    generator.tableRow(["Row 1, Cell 1", "Row 1, Cell 2"]);

    expect(generator.render()).toBe(
      "# Title\n## Subtitle\nParagraph\n* Item 1\n* Item 2\n1. Item 1\n1. Item 2\n```javascript\nconsole.log('Hello, World!');\n```\n> Quote\n**Bold**\n*Italic*\n~~Strikethrough~~\n[Link](https://ethang.dev/)\n![Image](https://ethang.dev/logo.png)\n\n| Header 1 | Header 2 |\n| --- | --- |\n| Row 1, Cell 1 | Row 1, Cell 2 |\n"
    );
  });

  it("should generate nested list and task list", () => {
      const generator = new MarkdownGenerator();
      generator.unorderedList([
          "Item 1",
          ["Sub Item 1", "Sub Item 2"]
      ]);
      generator.numberedList([
          "Item 1",
          ["Sub Item 1", "Sub Item 2"]
      ]);
      generator.taskList([
          { isComplete: true, label: "Done" },
          { isComplete: false, label: "Todo" }
      ]);
      generator.inlineCode("code");
      generator.alert("NOTE", "This is a note.");
      generator.subscript("sub");
      generator.superscript("sup");
      generator.mention("ethang");

      expect(generator.render()).toBe("* Item 1\n\t* Sub Item 1\n\t* Sub Item 2\n1. Item 1\n\t1. Sub Item 1\n\t1. Sub Item 2\n[X] Done[ ] Todo\n`code`\n> [!NOTE]\n> This is a note.\n<sub>sub</sub>\n<sup>sup</sup>\n@ethang\n");
  });
});
