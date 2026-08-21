import { DateTime, Option } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import trim from "lodash/trim.js";

export const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export const parseApplicationDateParam = (value: null | string | undefined) => {
  if (isNil(value)) {
    return null;
  }

  const date = trim(value);
  return ISO_DATE_PATTERN.test(date) ? date : null;
};

export const applicationsLoginRedirect = () => {
  return `/login?redirect=${encodeURIComponent("/applications")}`;
};

export const applicationsPagePath = (date: null | string) => {
  return isNil(date)
    ? "/applications"
    : `/applications?date=${encodeURIComponent(date)}`;
};

export type ApplicationPagination = {
  readonly currentIndex: number;
  readonly entries: readonly ApplicationPaginationEntry[];
};

export type ApplicationPaginationEntry = {
  readonly href: string;
  readonly label: string;
};

export const applicationDatePagination = (
  dates: readonly string[],
  selectedDate: null | string
) => {
  const entries = map(dates, (date) => {
    return {
      href: applicationsPagePath(date),
      label: formatApplicationDate(date)
    };
  });

  if (isEmpty(dates)) {
    return { currentIndex: -1, entries };
  }

  const selectedIndex = dates.indexOf(selectedDate ?? "");
  return {
    currentIndex: -1 === selectedIndex ? 0 : selectedIndex,
    entries
  };
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

export const isSafeApplicationUrl = (value: null | string | undefined) => {
  if (!isString(value) || value.includes("\\")) {
    return false;
  }

  const parsed = URL.parse(value);
  return isNil(parsed)
    ? false
    : "http:" === parsed.protocol || "https:" === parsed.protocol;
};
