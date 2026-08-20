import { ParseResult, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

import { isIsoDate } from "../domain/job-application/iso-date.ts";

const CURSOR_SEPARATOR = "|";
const CURSOR_PARTS = 2;

export const ApplicationCursorSchema = Schema.Struct({
  appliedDate: Schema.NonEmptyString,
  id: Schema.NonEmptyString
});

export type ApplicationCursor = Schema.Schema.Type<
  typeof ApplicationCursorSchema
>;

export const encodeApplicationCursor = (cursor: ApplicationCursor) => {
  return `${cursor.appliedDate}${CURSOR_SEPARATOR}${cursor.id}`;
};

export const parseCursorParts = (parts: readonly unknown[]) => {
  const [appliedDate, id] = parts;
  if (!isString(appliedDate) || !isString(id)) {
    return null;
  }
  if ("" === appliedDate || "" === id || !isIsoDate(appliedDate)) {
    return null;
  }
  return { appliedDate, id };
};

export const decodeApplicationCursor = (value: null | string | undefined) => {
  if (isNil(value)) {
    return null;
  }
  const parts = split(trim(value), CURSOR_SEPARATOR);
  return parts.length === CURSOR_PARTS ? parseCursorParts(parts) : null;
};

export const ApplicationCursorFromEncoded = Schema.transformOrFail(
  Schema.NonEmptyString,
  ApplicationCursorSchema,
  {
    decode: (value, _options, ast) => {
      const decoded = decodeApplicationCursor(value);
      return isNil(decoded)
        ? ParseResult.fail(
            new ParseResult.Type(
              ast,
              value,
              "Expected an encoded application cursor (appliedDate|id)"
            )
          )
        : ParseResult.succeed(decoded);
    },
    encode: (cursor) => {
      return ParseResult.succeed(encodeApplicationCursor(cursor));
    },
    strict: false
  }
);
