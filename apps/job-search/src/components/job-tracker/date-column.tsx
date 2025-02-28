import isNil from "lodash/isNil";

type DateColumnProperties = Readonly<{
  date: unknown;
}>;

export const DateColumn = ({ date }: DateColumnProperties) => {
  if (isNil(date)) {
    return "";
  }

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */}
      {new Date(String(date as string)).toLocaleString(undefined, {
        dateStyle: "medium",
      })}
    </>
  );
};
