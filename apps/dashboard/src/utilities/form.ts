import isDate from "lodash/isDate.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import { DateTime } from "luxon";

export const formDataFormat = "yyyy-MM-dd";

export const getFormDate = (date: Date | null | string | undefined) => {
  if (isNil(date)) {
    return "";
  }

  if (isString(date)) {
    return DateTime.fromISO(date).toFormat(formDataFormat);
  }

  return DateTime.fromJSDate(date).toFormat(formDataFormat);
};

export const formDateToIso = (date: Date | null | string) => {
  if (!isDate(date) || !isString(date) || isEmpty(date) || isNil(date)) {
    return null;
  }

  const fromIso = isDate(date)
    ? DateTime.fromJSDate(date)
    : DateTime.fromISO(date);

  if (fromIso.isValid) {
    return fromIso.toISO();
  }

  const fromFormat = DateTime.fromFormat(date, formDataFormat);
  if (fromFormat.isValid) {
    return fromFormat.toISO();
  }

  return null;
};
