import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";
import { DateTime } from "luxon";

export const normalizeDate = (dateString?: null | string) => {
  if (isNil(dateString) || !isString(dateString) || "" === trim(dateString)) {
    return DateTime.now().toUTC().toISO();
  }

  const cleanedString = dateString
    .replaceAll(/\bUTC\b/gu, "GMT")
    .replaceAll(/\bUT\b/gu, "GMT");

  const parsedIso = DateTime.fromISO(cleanedString);
  if (parsedIso.isValid) {
    return parsedIso.toUTC().toISO();
  }

  const parsedRfc = DateTime.fromRFC2822(cleanedString);
  if (parsedRfc.isValid) {
    return parsedRfc.toUTC().toISO();
  }

  return DateTime.now().toUTC().toISO();
};
