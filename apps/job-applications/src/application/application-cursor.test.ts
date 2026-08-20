import { Effect, Schema } from "effect";
import repeat from "lodash/repeat.js";
import { describe, expect, it } from "vitest";

import {
  ApplicationCursorFromEncoded,
  decodeApplicationCursor,
  encodeApplicationCursor,
  parseCursorParts
} from "./application-cursor.ts";

const APPLIED_DATE = "2026-08-01";
const ID = "01JZQ0EXAMPLE";
const CURSOR = { appliedDate: APPLIED_DATE, id: ID };
const ENCODED = `${APPLIED_DATE}|${ID}`;

describe("encodeApplicationCursor", () => {
  it("joins the applied date and id with a separator", () => {
    expect(encodeApplicationCursor(CURSOR)).toBe(ENCODED);
  });
});

describe("parseCursorParts", () => {
  it("parses valid string parts", () => {
    expect(parseCursorParts([APPLIED_DATE, ID])).toStrictEqual(CURSOR);
  });

  it.each([
    [[1, ID]],
    [[APPLIED_DATE, 42]],
    [[null, ID]],
    [[APPLIED_DATE, null]]
  ])("rejects non-string parts %j", (parts) => {
    expect(parseCursorParts(parts)).toBeNull();
  });
});

describe("decodeApplicationCursor", () => {
  it.each([
    [ENCODED, CURSOR],
    [`  ${ENCODED}  `, CURSOR]
  ])("decodes %j", (input, expected) => {
    expect(decodeApplicationCursor(input)).toStrictEqual(expected);
  });

  it.each([
    [null],
    [""],
    [repeat(" ", 3)],
    // legacy bare-id cursors from before the composite format
    [ID],
    [APPLIED_DATE],
    [`2026-8-01|${ID}`],
    [`2026-13-01|${ID}`],
    [`${APPLIED_DATE}|`],
    [`|${ID}`],
    [`${ENCODED}|extra`]
  ])("rejects a malformed cursor %j", (input) => {
    expect(decodeApplicationCursor(input)).toBeNull();
  });

  it("round-trips an encoded cursor", () => {
    expect(
      decodeApplicationCursor(encodeApplicationCursor(CURSOR))
    ).toStrictEqual(CURSOR);
  });
});

describe("ApplicationCursorFromEncoded", () => {
  it("encodes a structured cursor back to the wire format", () => {
    expect(
      Effect.runSync(Schema.encode(ApplicationCursorFromEncoded)(CURSOR))
    ).toBe(ENCODED);
  });
});
