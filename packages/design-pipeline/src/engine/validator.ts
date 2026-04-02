import type { ZodError } from "zod";

import difference from "lodash/difference.js";
import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import type {
  ValidationError,
  ValidationResult,
} from "../contracts/shared/validation-result.js";
import type { PipelineState } from "../state-machine/pipeline-state.js";

import { DebateModeratorOutputSchema } from "../contracts/debate-moderator.js";
import { CodeWriterOutputSchema } from "../contracts/shared/code-writer-output.js";
import { TestWriterOutputSchema } from "../contracts/shared/test-writer-output.js";
import { TlaWriterOutputSchema } from "../contracts/tla-writer.js";

const STRUCTURAL_INVALID_FIELD = "STRUCTURAL_INVALID_FIELD";
const HEURISTIC_MISSING_EXPERT = "HEURISTIC_MISSING_EXPERT";
const HEURISTIC_TLA_INCOMPLETE = "HEURISTIC_TLA_INCOMPLETE";
const HEURISTIC_WRONG_EXTENSION = "HEURISTIC_WRONG_EXTENSION";
const VALID_VALUE = "valid value";

const mapZodErrors = (zodError: ZodError): ValidationError[] => {
  return map(zodError.issues, (issue) => {
    return {
      code: STRUCTURAL_INVALID_FIELD,
      expected: VALID_VALUE,
      hint: issue.message,
      path: issue.path.join("."),
      received: issue.message,
    };
  });
};

const validResult = (): ValidationResult => {
  return { errors: [], valid: true };
};

const errorResult = (errors: ValidationError[]): ValidationResult => {
  return { errors, valid: false };
};

const hasTlaPlusKeywords = (content: string): boolean => {
  const hasVariables = includes(content, "VARIABLES");
  const hasInit = includes(content, "Init");
  const hasNext = includes(content, "Next");
  const hasInvariant =
    includes(content, "INVARIANT") || includes(content, "[]");

  return hasVariables && hasInit && hasNext && hasInvariant;
};

const hasPlusCalKeywords = (content: string): boolean => {
  const hasVariables = includes(content, "variables");
  const hasBegin = includes(content, "begin");
  const hasProcessOrAlgorithm =
    includes(content, "process") || includes(content, "algorithm");
  const hasTranslation = includes(content, "BEGIN TRANSLATION");

  return hasVariables && hasBegin && hasProcessOrAlgorithm && hasTranslation;
};

const checkFileExtensions = (
  files: string[],
  expectedSuffix: string,
  pathField: string,
): ValidationError[] => {
  const wrongFiles = filter(files, (file) => {
    return !endsWith(file, expectedSuffix);
  });

  if (0 < wrongFiles.length) {
    return [
      {
        code: HEURISTIC_WRONG_EXTENSION,
        expected: `all files ending with ${expectedSuffix}`,
        hint: `Files with wrong extension: ${wrongFiles.join(", ")}`,
        path: pathField,
        received: wrongFiles.join(", "),
      },
    ];
  }

  return [];
};

const TS_EXTENSION = ".ts";
const TSX_EXTENSION = ".tsx";
const TEST_TS_EXTENSION = ".test.ts";
const SPEC_TS_EXTENSION = ".spec.ts";
const FILES_WRITTEN_PATH = "filesWritten";
const TEST_FILES_WRITTEN_PATH = "testFilesWritten";

const CODE_WRITER_EXTENSION_MAP: Readonly<Record<string, string>> = {
  "hono-writer": TS_EXTENSION,
  "typescript-writer": TS_EXTENSION,
  "ui-writer": TSX_EXTENSION,
};

const TEST_WRITER_EXTENSION_MAP: Readonly<Record<string, string>> = {
  "playwright-writer": SPEC_TS_EXTENSION,
  "vitest-writer": TEST_TS_EXTENSION,
};

export const validateDebateOutput = (
  output: unknown,
  state: PipelineState,
): ValidationResult => {
  const parseResult = DebateModeratorOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return errorResult(mapZodErrors(parseResult.error));
  }

  const parsed = parseResult.data;
  const expectedExperts: unknown = get(state, [
    "accumulatedContext",
    "experts",
  ]);
  const expertsList = isArray(expectedExperts) ? expectedExperts : [];

  const missingExperts = difference(expertsList, parsed.participatingExperts);

  if (0 < missingExperts.length) {
    return errorResult([
      {
        code: HEURISTIC_MISSING_EXPERT,
        expected: `all experts: ${expertsList.join(", ")}`,
        hint: `Missing experts: ${missingExperts.join(", ")}`,
        path: "participatingExperts",
        received: parsed.participatingExperts.join(", "),
      },
    ]);
  }

  return validResult();
};

export const validateTlaWriterOutput = (
  output: unknown,
  _state: PipelineState,
): ValidationResult => {
  const parseResult = TlaWriterOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return errorResult(mapZodErrors(parseResult.error));
  }

  const parsed = parseResult.data;
  const content = parsed.specContent;

  if (!hasTlaPlusKeywords(content) && !hasPlusCalKeywords(content)) {
    return errorResult([
      {
        code: HEURISTIC_TLA_INCOMPLETE,
        expected:
          "TLA+ (VARIABLES, Init, Next, INVARIANT/[]) or PlusCal (variables, begin, process/algorithm, BEGIN TRANSLATION)",
        hint: "specContent does not contain required TLA+ or PlusCal keywords",
        path: "specContent",
        received: content.slice(0, 100),
      },
    ]);
  }

  return validResult();
};

export const validateCodeWriterOutput = (
  output: unknown,
  _state: PipelineState,
  writerType: string,
): ValidationResult => {
  const parseResult = CodeWriterOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return errorResult(mapZodErrors(parseResult.error));
  }

  const parsed = parseResult.data;
  const expectedExtension = get(CODE_WRITER_EXTENSION_MAP, [writerType]);

  if (isString(expectedExtension)) {
    const extensionErrors = checkFileExtensions(
      parsed.filesWritten,
      expectedExtension,
      FILES_WRITTEN_PATH,
    );

    if (0 < extensionErrors.length) {
      return errorResult(extensionErrors);
    }
  }

  return validResult();
};

export const validateTestWriterOutput = (
  output: unknown,
  _state: PipelineState,
  writerType: string,
): ValidationResult => {
  const parseResult = TestWriterOutputSchema.safeParse(output);

  if (!parseResult.success) {
    return errorResult(mapZodErrors(parseResult.error));
  }

  const parsed = parseResult.data;
  const expectedExtension = get(TEST_WRITER_EXTENSION_MAP, [writerType]);

  if (isString(expectedExtension)) {
    const extensionErrors = checkFileExtensions(
      parsed.testFilesWritten,
      expectedExtension,
      TEST_FILES_WRITTEN_PATH,
    );

    if (0 < extensionErrors.length) {
      return errorResult(extensionErrors);
    }
  }

  return validResult();
};
