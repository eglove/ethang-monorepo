import { Schema } from "effect";
import { DateTime } from "luxon";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export type PlanSection = {
  content: string;
  title: string;
};

export const PlanSectionSchema = Schema.Struct({
  content: Schema.String,
  title: Schema.String
});

export const PlanOutputSchema = Schema.Struct({
  generatedAt: Schema.String,
  sections: Schema.Array(PlanSectionSchema)
});

export type PlanOutput = Schema.Schema.Type<typeof PlanOutputSchema>;

export async function writePlan(
  sections: PlanSection[],
  outputPath?: string
): Promise<{ jsonPath: string; markdownPath: string }> {
  const markdownPath = path.resolve(outputPath ?? "plan.md");
  const parsed = path.parse(markdownPath);
  const jsonPath = path.join(parsed.dir, `${parsed.name}.json`);

  const lines: string[] = [`# Plan`, ""];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "", section.content, "");
  }

  const markdownContent = lines.join("\n");
  await writeFile(markdownPath, markdownContent, "utf8");

  const jsonOutput: PlanOutput = {
    generatedAt: DateTime.now().toISO(),
    sections
  };

  const jsonContent = JSON.stringify(jsonOutput, null, 2);
  await writeFile(jsonPath, jsonContent, "utf8");

  return { jsonPath, markdownPath };
}
