import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { FrontmatterSchema } from "./frontmatter.ts";
import { HandoffContractSchema } from "./handoff-contract.ts";
import { SectionSchema } from "./section.ts";

const VALID_FRONTMATTER_DESCRIPTION = "parses a valid frontmatter object";
const MISSING_NAME_DESCRIPTION = "throws ZodError when name is missing";
const EMPTY_DESCRIPTION_DESCRIPTION =
  "throws ZodError when description is empty";

describe("FrontmatterSchema", () => {
  it(VALID_FRONTMATTER_DESCRIPTION, () => {
    const input = { description: "A test agent", name: "test-agent" };
    const result = FrontmatterSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(MISSING_NAME_DESCRIPTION, () => {
    const input = { description: "A test agent" };

    expect(() => {
      FrontmatterSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_DESCRIPTION_DESCRIPTION, () => {
    const input = { description: "", name: "test-agent" };

    expect(() => {
      FrontmatterSchema.parse(input);
    }).toThrow(ZodError);
  });
});

describe("SectionSchema", () => {
  it("parses a valid section object", () => {
    const input = { heading: "## Process", required: true };
    const result = SectionSchema.parse(input);

    expect(result).toStrictEqual(input);
  });
});

describe("HandoffContractSchema", () => {
  it("parses a valid handoff contract", () => {
    const input = {
      passes: "Implementation plan file path",
      passesTo: "design-pipeline",
    };
    const result = HandoffContractSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("throws ZodError when passesTo is missing", () => {
    const input = { passes: "Implementation plan file path" };

    expect(() => {
      HandoffContractSchema.parse(input);
    }).toThrow(ZodError);
  });
});
