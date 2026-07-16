import { DateTime, Option } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

export const normalizeDate = (dateString?: null | string) => {
  if (isNil(dateString) || !isString(dateString) || "" === trim(dateString)) {
    return DateTime.formatIso(DateTime.unsafeNow());
  }

  const cleanedString = dateString
    .replaceAll(/\bUTC\b/gu, "GMT")
    .replaceAll(/\bUT\b/gu, "GMT");

  const parsedIso = DateTime.make(cleanedString);
  if (Option.isSome(parsedIso)) {
    return DateTime.formatIso(parsedIso.value);
  }

  const timestamp = Date.parse(cleanedString);
  if (!Number.isNaN(timestamp)) {
    return DateTime.formatIso(DateTime.unsafeMake(timestamp));
  }

  return DateTime.formatIso(DateTime.unsafeNow());
};
