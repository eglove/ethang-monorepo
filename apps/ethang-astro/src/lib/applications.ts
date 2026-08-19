import { DateTime, Option } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

export const APPLICATION_PAGE_SIZE = 25;

export const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const parseApplicationCursor = (value: null | string | undefined) => {
  if (isNil(value)) {
    return null;
  }

  const cursor = trim(value);
  return "" === cursor ? null : cursor;
};

export const applicationsLoginRedirect = () => {
  return `/login?redirect=${encodeURIComponent("/applications")}`;
};

export const applicationsPagePath = (after: null | string) => {
  return isNil(after)
    ? "/applications"
    : `/applications?after=${encodeURIComponent(after)}`;
};

export const formatApplicationValue = (value: null | string | undefined) => {
  return "" === value || isNil(value) ? "—" : value;
};

export const formatApplicationDate = (value: null | string | undefined) => {
  if ("" === value || isNil(value)) {
    return formatApplicationValue(value);
  }

  const maybeDate = DateTime.make(
    /^\d{4}-\d{2}-\d{2}$/u.test(value) ? `${value}T00:00:00Z` : value
  );
  if (Option.isNone(maybeDate)) {
    return formatApplicationValue(value);
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  });
  return formatter.format(DateTime.toDateUtc(maybeDate.value));
};

export const isApplicationStatus = (
  value: unknown
): value is ApplicationStatus => {
  return (
    isString(value) &&
    (APPLICATION_STATUSES as readonly string[]).includes(value)
  );
};
