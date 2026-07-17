import { describe, expect, it } from "vitest";

import { parseAutofixPayload } from "../src/domain/eslint-autofix.ts";
import { buildPayload, message } from "./eslint-autofix-helpers.ts";

describe(parseAutofixPayload, () => {
  it("parses a well-formed autofix payload", () => {
    const raw = buildPayload([
      {
        filePath: "a.ts",
        postFixMessages: [],
        preFixMessages: [message({ ruleId: "no-unused-vars", severity: 2 })]
      }
    ]);

    const parsed = parseAutofixPayload(raw);

    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]?.filePath).toBe("a.ts");
    expect(parsed.results[0]?.preFixMessages).toHaveLength(1);
    expect(parsed.results[0]?.postFixMessages).toStrictEqual([]);
  });

  it("rejects the wrong root shape", () => {
    expect(() => {
      parseAutofixPayload(JSON.stringify({ notResults: [] }));
    }).toThrow(/results[\s\S]*is missing/u);

    expect(() => {
      parseAutofixPayload("[]");
    }).toThrow(/Expected \{ readonly results[\s\S]*\}, actual \[\]/u);

    expect(() => {
      parseAutofixPayload("null");
    }).toThrow(/Expected \{ readonly results[\s\S]*\}, actual null/u);
  });

  it("rejects malformed result entries", () => {
    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [{ filePath: 42, postFixMessages: [], preFixMessages: [] }]
        })
      );
    }).toThrow(/Expected string, actual 42/u);

    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            { filePath: "a.ts", postFixMessages: [], preFixMessages: "x" }
          ]
        })
      );
    }).toThrow(/Expected ReadonlyArray.*actual "x"/u);

    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            { filePath: "a.ts", postFixMessages: [], preFixMessages: [] },
            "bad"
          ]
        })
      );
    }).toThrow(/actual "bad"/u);
  });

  it("rejects malformed message entries", () => {
    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            {
              filePath: "a.ts",
              postFixMessages: [],
              preFixMessages: [
                {
                  column: "1",
                  fixable: true,
                  line: 1,
                  message: "msg",
                  ruleId: "r",
                  severity: 2
                }
              ]
            }
          ]
        })
      );
    }).toThrow(/Expected number, actual "1"/u);

    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            {
              filePath: "a.ts",
              postFixMessages: [
                {
                  column: 1,
                  fixable: true,
                  line: 1,
                  message: "msg",
                  ruleId: 5,
                  severity: 2
                }
              ],
              preFixMessages: []
            }
          ]
        })
      );
    }).toThrow(/Expected null, actual 5/u);
  });

  it("rejects non-string ruleId values", () => {
    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            {
              filePath: "a.ts",
              postFixMessages: [],
              preFixMessages: [
                {
                  column: 1,
                  fixable: true,
                  line: 1,
                  message: "msg",
                  ruleId: 5,
                  severity: 2
                }
              ]
            }
          ]
        })
      );
    }).toThrow(/Expected null, actual 5/u);
  });

  it("rejects invalid JSON", () => {
    expect(() => {
      parseAutofixPayload("{ not json");
    }).toThrow(/Expected property name or '\}' in JSON/u);
  });

  it("accepts null ruleId and matches against the unknown rule bucket", () => {
    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            {
              filePath: "a.ts",
              postFixMessages: [],
              preFixMessages: [
                {
                  column: 1,
                  fixable: true,
                  line: 1,
                  message: "msg",
                  ruleId: null,
                  severity: 2
                }
              ]
            }
          ]
        })
      );
    }).not.toThrow();
  });

  it("rejects non-object message entries", () => {
    expect(() => {
      parseAutofixPayload(
        JSON.stringify({
          results: [
            {
              filePath: "a.ts",
              postFixMessages: ["not-an-object"],
              preFixMessages: []
            }
          ]
        })
      );
    }).toThrow(/Expected.*actual "not-an-object"/u);
  });
});
