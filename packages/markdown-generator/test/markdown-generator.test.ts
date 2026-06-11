import { describe, expect, it } from "vitest";

import {
  bold,
  generateMarkdown,
  image,
  inlineCode,
  italic,
  link,
  mention,
  strikeThrough,
  subscript,
  superscript
} from "../src/markdown-generator.ts";

// eslint-disable-next-line sonar/max-lines-per-function
describe("Markdown Generator", () => {
  describe("Inline Utilities", () => {
    it("bold wraps text in double asterisks", () => {
      expect(bold("hello")).toBe("**hello**");
    });

    it("italic wraps text in single asterisks", () => {
      expect(italic("hello")).toBe("*hello*");
    });

    it("link formats text and url", () => {
      expect(link("google", "https://google.com")).toBe(
        "[google](https://google.com)"
      );
    });

    it("image formats alt text and url", () => {
      expect(image("logo", "logo.png")).toBe("![logo](logo.png)");
    });

    it("inlineCode wraps text in backticks", () => {
      expect(inlineCode("const x = 1")).toBe("`const x = 1`");
    });

    it("mention prefixes text with @", () => {
      expect(mention("user")).toBe("@user");
    });

    it("subscript wraps text in sub tags", () => {
      expect(subscript("text")).toBe("<sub>text</sub>");
    });

    it("superscript wraps text in sup tags", () => {
      expect(superscript("text")).toBe("<sup>text</sup>");
    });

    it("strikeThrough wraps text in double tildes", () => {
      expect(strikeThrough("deleted")).toBe("~~deleted~~");
    });
  });

  // eslint-disable-next-line sonar/max-lines-per-function
  describe("Document Generation", () => {
    describe("Frontmatter", () => {
      it("renders simple YAML frontmatter keys", () => {
        const document = {
          blocks: [],
          frontmatter: {
            draft: false,
            title: "My Doc"
          }
        };
        const expected = `---\ntitle: My Doc\ndraft: false\n---\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("escapes ambiguous YAML values containing colons or hashes", () => {
        const document = {
          blocks: [],
          frontmatter: {
            description: "Some #tag here",
            title: "Title: Subtitle"
          }
        };
        const expectedExact = `---\ntitle: "Title: Subtitle"\ndescription: "Some #tag here"\n---\n`;
        expect(generateMarkdown(document)).toBe(expectedExact);
      });

      it("throws error when a frontmatter value contains newlines", () => {
        const document = {
          blocks: [],
          frontmatter: {
            title: "Title\nwith newline"
          }
        };
        expect(() => {
          return generateMarkdown(document);
        }).toThrow('Frontmatter value for "title" contains a newline');
      });
    });

    describe("Blocks", () => {
      it("renders headers with correct level prefixes", () => {
        const document = {
          blocks: [
            { level: 1 as const, text: "Header 1", type: "header" as const },
            { level: 2 as const, text: "Header 2", type: "header" as const },
            { level: 3 as const, text: "Header 3", type: "header" as const }
          ]
        };
        const expected = `# Header 1\n\n## Header 2\n\n### Header 3\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders text blocks", () => {
        const document = {
          blocks: [
            { text: "Simple paragraph text.", type: "text" as const },
            { text: "Second paragraph.", type: "text" as const }
          ]
        };
        const expected = `Simple paragraph text.\n\nSecond paragraph.\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders alerts with standard GitHub alert formatting", () => {
        const document = {
          blocks: [
            {
              alertType: "CAUTION" as const,
              text: "Be careful!",
              type: "alert" as const
            },
            {
              alertType: "NOTE" as const,
              text: "Some info.",
              type: "alert" as const
            }
          ]
        };
        const expected = `> [!CAUTION]\n> Be careful!\n\n> [!NOTE]\n> Some info.\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders code blocks with optional language tags", () => {
        const document = {
          blocks: [
            {
              code: "console.log(1);",
              language: "js",
              type: "codeBlock" as const
            },
            { code: "plain text code", type: "codeBlock" as const }
          ]
        };
        const expected = `\`\`\`js\nconsole.log(1);\n\`\`\`\n\n\`\`\`\nplain text code\n\`\`\`\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders quotes prefixed with blockquote character", () => {
        const document = {
          blocks: [{ text: "This is a quote.", type: "quote" as const }]
        };
        const expected = `> This is a quote.\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders task lists with checkboxes", () => {
        const document = {
          blocks: [
            {
              items: [
                { isComplete: true, label: "Task 1" },
                { isComplete: false, label: "Task 2" }
              ],
              type: "taskList" as const
            }
          ]
        };
        const expected = `[X] Task 1\n[ ] Task 2\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });
    });

    describe("Lists", () => {
      it("renders unordered lists with nested object children", () => {
        const document = {
          blocks: [
            {
              items: [
                { text: "Level One" },
                {
                  children: [
                    { text: "Level Two" },
                    {
                      children: [{ text: "Level Three" }],
                      text: "Level Two Parent"
                    }
                  ],
                  text: "Level One Parent"
                },
                { text: "Level One End" }
              ],
              type: "unorderedList" as const
            }
          ]
        };
        const expected = `* Level One\n* Level One Parent\n\t* Level Two\n\t* Level Two Parent\n\t\t* Level Three\n* Level One End\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders numbered lists with nested object children", () => {
        const document = {
          blocks: [
            {
              items: [
                { text: "First Item" },
                {
                  children: [{ text: "Child Item" }],
                  text: "Second Item"
                }
              ],
              type: "numberedList" as const
            }
          ]
        };
        const expected = `1. First Item\n1. Second Item\n\t1. Child Item\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });
    });

    describe("Tables", () => {
      it("renders simple tables with cells", () => {
        const document = {
          blocks: [
            {
              headers: ["Name", "Age"],
              rows: [
                ["Alice", "24"],
                ["Bob", "30"]
              ],
              type: "table" as const
            }
          ]
        };
        const expected = `| Name | Age |\n| --- | --- |\n| Alice | 24 |\n| Bob | 30 |\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("renders tables with column alignment configurations", () => {
        const document = {
          blocks: [
            {
              headers: [
                { align: "left" as const, text: "Left" },
                { align: "center" as const, text: "Center" },
                { align: "right" as const, text: "Right" }
              ],
              rows: [["A", "B", "C"]],
              type: "table" as const
            }
          ]
        };
        const expected = `| Left | Center | Right |\n| :--- | :---: | ---: |\n| A | B | C |\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("throws error when table row cell count mismatches header count", () => {
        const document = {
          blocks: [
            {
              headers: ["Name", "Age"],
              rows: [["Alice", "24", "Extra Column"]],
              type: "table" as const
            }
          ]
        };
        expect(() => {
          return generateMarkdown(document);
        }).toThrow("Table row cell count (3) does not match header count (2)");
      });
    });

    describe("Spacing", () => {
      it("separates blocks with double newlines by default", () => {
        const document = {
          blocks: [
            { text: "Block A", type: "text" as const },
            { text: "Block B", type: "text" as const }
          ]
        };
        const expected = `Block A\n\nBlock B\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("supports custom overrides using space blocks", () => {
        const document = {
          blocks: [
            { text: "Block A", type: "text" as const },
            { count: 3, type: "space" as const },
            { text: "Block B", type: "text" as const }
          ]
        };
        const expected = `Block A\n\n\n\nBlock B\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });

      it("supports space blocks with default count", () => {
        const document = {
          blocks: [
            { text: "Block A", type: "text" as const },
            { type: "space" as const },
            { text: "Block B", type: "text" as const }
          ]
        };
        const expected = `Block A\n\nBlock B\n`;
        expect(generateMarkdown(document)).toBe(expected);
      });
    });

    describe("Edge Cases", () => {
      it("returns empty string for unknown block types", () => {
        const document = {
          blocks: [{ type: "unknown" as unknown }]
        };
        // @ts-expect-error for test
        expect(generateMarkdown(document)).toBe("");
      });
    });
  });
});
