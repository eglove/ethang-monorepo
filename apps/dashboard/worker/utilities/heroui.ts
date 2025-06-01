import type { DateInput } from "@heroui/react";

import { now, parseAbsoluteToLocal } from "@internationalized/date";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";

export type DateInputValue = Exclude<
  Parameters<typeof DateInput>[0]["value"],
  undefined
>;

export const convertIsoToDateTimeInput = (value: null | string | undefined) => {
  return isNil(value)
    ? null
    : parseAbsoluteToLocal(DateTime.fromISO(value).toUTC().toString());
};

export const convertDateTimeInputToIso = (value: DateInputValue) => {
  if (isNil(value)) {
    return null;
  }

  const zone = DateTime.now().zoneName;
  const newValue = DateTime.fromJSDate(value.toDate(zone)).toISO();

  if (!isNil(newValue)) {
    return newValue;
  }

  return null;
};

export const getDateTimeInputNow = () => {
  return now(DateTime.now().zoneName);
};
