import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { outputConfigs } from "./output-config.ts";

const readConfig = (fileName: string) => {
  return readFileSync(path.join(import.meta.dirname, `../${fileName}`), "utf8");
};

describe("generated config files", () => {
  for (const output of outputConfigs) {
    it(`config ${output.fileName} matches snapshot`, () => {
      expect(readConfig(output.fileName)).toMatchSnapshot();
    });
  }
});
