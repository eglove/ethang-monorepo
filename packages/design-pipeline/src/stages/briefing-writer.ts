import toLower from "lodash/toLower.js";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { QuestionerArtifact } from "../types/questioner-session.ts";

export function formatBriefingMarkdown(
  artifact: QuestionerArtifact,
  topic: string,
  date: string,
): string {
  const status =
    "completed" === artifact.sessionState ? "COMPLETE" : "[INCOMPLETE]";
  const lines: string[] = [
    `# Questioner Session — ${topic}`,
    "",
    `**Date:** ${date}`,
    `**Status:** ${status}`,
    `**Dispatched to:** pending`,
    "",
    "---",
    "",
    "## Questions and Answers",
    "",
  ];

  for (const qa of artifact.questions) {
    lines.push(`### Q: ${qa.question}`, "", `**A:** ${qa.answer}`, "");
  }

  if (null !== artifact.summary) {
    lines.push("---", "", "## Summary", "", artifact.summary, "");
  }

  if ("[INCOMPLETE]" === status) {
    lines.push(
      "---",
      "",
      "## Open Questions",
      "",
      "*Session ended before sign-off.*",
      "",
    );
  }

  lines.push("## Debate Requested", "", "Yes", "");

  return lines.join("\n");
}

export function generateBriefingPath(topic: string, date: string): string {
  const slug = toLower(topic)
    .replaceAll(/[^\da-z]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
  return `docs/questioner-sessions/${date}_${slug}.md`;
}

export function writeBriefingFile(
  artifact: QuestionerArtifact,
  topic: string,
  date: string,
): string {
  const filePath = generateBriefingPath(topic, date);
  const content = formatBriefingMarkdown(artifact, topic, date);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  return filePath;
}
