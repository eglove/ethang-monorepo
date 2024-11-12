import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";

type NestedStringArray = NestedStringArray[] | string;

export class MarkdownGenerator {
  private markdown = "";

  public alert(type: "CAUTION" | "IMPORTANT" | "NOTE" | "TIP" | "WARNING", text: string, lineBreaksAfter = 0) {
    this.markdown += `> [!${type}]\n`;
    this.markdown += `> ${text}`;
    this.newLine(lineBreaksAfter);
  }

  public bold(text: string, lineBreaksAfter = 0) {
    this.markdown += `**${text}**`;
    this.newLine(lineBreaksAfter);
  }

  public codeBlock(text: string, language = "", lineBreaksAfter = 0) {
    this.markdown += `\`\`\`${language}
${text}
\`\`\``;
    this.newLine(lineBreaksAfter);
  }

  public header(level: 1 | 2 | 3, text: string, lineBreaksAfter = 0) {
    let prefix = "";
    for (let index = 0; index < level; index += 1) {
      prefix += "#";
    }

    this.markdown += `${prefix} ${text}`;
    this.newLine(lineBreaksAfter);
  }

  public image(text: string, url: string, lineBreaksAfter = 0) {
    this.markdown = `![${text}](${url})`;
    this.newLine(lineBreaksAfter);
  }

  public inlineCode(text: string, lineBreaksAfter = 0) {
    this.markdown += `\`${text}\``;
    this.newLine(lineBreaksAfter);
  }

  public italic(text: string, lineBreaksAfter = 0) {
    this.markdown += `*${text}*`;
    this.newLine(lineBreaksAfter);
  }

  public link(text: string, url: string, lineBreaksAfter = 0) {
    this.markdown += `[${text}](${url})`;
    this.newLine(lineBreaksAfter);
  }

  public mention(text: string, lineBreaksAfter = 0) {
    this.markdown += `@${text}`;
    this.newLine(lineBreaksAfter);
  }

  public newLine(times?: number) {
    if (isNil(times)) {
      this.markdown += "\n";
    } else {
      for (let index = 0; index < times; index += 1) {
        this.markdown += "\n";
      }
    }
  }

  public numberedList(texts: NestedStringArray, level = 0) {
    let space = "";
    for (let index = 0; index < level; index += 1) {
      space += "\t";
    }

    for (const text of texts) {
      if (isArray(text)) {
        this.numberedList(text, level + 1);
      } else {
        this.markdown += `${space}1. ${text}\n`;
      }
    }
  }

  public quote(text: string, lineBreaksAfter = 0) {
    this.markdown += `> ${text}`;
    this.newLine(lineBreaksAfter);
  }

  public render() {
    return this.markdown;
  }

  public strikeThrough(text: string, lineBreaksAfter = 0) {
    this.markdown += `~~${text}~~`;
    this.newLine(lineBreaksAfter);
  }

  public subscript(text: string, lineBreaksAfter = 0) {
    this.markdown += `<sub>${text}</sub>`;
    this.newLine(lineBreaksAfter);
  }

  public superscript(text: string, lineBreaksAfter = 0) {
    this.markdown += `<sup>${text}</sup>`;
    this.newLine(lineBreaksAfter);
  }

  public taskList(texts: {
    isComplete: boolean;
    label: string;
  }[], lineBreaksAfter = 0) {
    for (const text of texts) {
      this.markdown += `[${text.isComplete
        ? "X"
        : " "}] ${text.label}`;
    }
    this.newLine(lineBreaksAfter);
  }

  public text(text: string, lineBreaksAfter = 0) {
    this.markdown += text;
    this.newLine(lineBreaksAfter);
  }

  public unorderedList(texts: NestedStringArray, level = 0) {
    let space = "";
    for (let index = 0; index < level; index += 1) {
      space += "\t";
    }

    for (const text of texts) {
      if (isArray(text)) {
        this.unorderedList(text, level + 1);
      } else {
        this.markdown += `${space}* ${text}\n`;
      }
    }
  }
}
