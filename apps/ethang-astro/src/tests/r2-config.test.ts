import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Astro R2 configuration", () => {
  it("uses the remote resume bucket during local development", async () => {
    const config = await readFile(
      new URL("../../wrangler.jsonc", import.meta.url),
      "utf8",
    );

    expect(config).toContain('"binding": "jobResumes"');
    expect(config).toContain('"remote": true');
  });
});
