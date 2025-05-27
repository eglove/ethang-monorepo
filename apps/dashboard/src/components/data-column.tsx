import isNil from "lodash/isNil";
import isString from "lodash/isString";

type DateColumnProperties = Readonly<{
  date: unknown;
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions;
}>;

const defaultOptions: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

export const DateColumn = ({
  date,
  dateTimeFormatOptions = defaultOptions,
}: DateColumnProperties) => {
  if (isNil(date) || !isString(date)) {
    return "";
  }

  return <>{new Date(date).toLocaleString(undefined, dateTimeFormatOptions)}</>;
};
