import isNil from "lodash/isNil";
import isString from "lodash/isString";

type DateColumnProperties = Readonly<{
  date: unknown;
}>;

export const DateColumn = ({ date }: DateColumnProperties) => {
  if (isNil(date) || !isString(date)) {
    return "";
  }

  return (
    <>
      {new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
      })}
    </>
  );
};
