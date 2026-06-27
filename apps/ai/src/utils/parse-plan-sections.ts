import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";

export function parsePlanSections(content: string): {
  content: string;
  title: string;
}[] {
  const sections: { content: string; title: string }[] = [];
  const lines = split(content, "\n");
  let currentTitle = "";
  const currentLines: string[] = [];

  for (const line of lines) {
    if (startsWith(line, "# ")) {
      // skip h1 lines
    } else if (startsWith(line, "## ")) {
      if (currentTitle) {
        sections.push({
          content: trim(currentLines.join("\n")),
          title: currentTitle
        });
      }
      currentTitle = trim(line.slice(3));
      currentLines.length = 0;
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.push({
      content: trim(currentLines.join("\n")),
      title: currentTitle
    });
  }

  return sections;
}
