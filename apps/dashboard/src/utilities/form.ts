import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import { DateTime } from "luxon";

export const formDataFormat = "yyyy-MM-dd";

export const getFormDate = (date: null | string | undefined) => {
  return isNil(date) ? "" : DateTime.fromISO(date).toFormat(formDataFormat);
};

export const formDateToIso = (date: string) => {
  if (!isString(date) || isEmpty(date)) {
    return null;
  }

  const fromIso = DateTime.fromISO(date);
  if (fromIso.isValid) {
    return fromIso.toISO();
  }

  const fromFormat = DateTime.fromFormat(date, formDataFormat);
  if (fromFormat.isValid) {
    return fromFormat.toISO();
  }

  return null;
};
