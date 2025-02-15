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
      {new Date(String(date)).toLocaleString(undefined, {
        dateStyle: "medium",
      })}
    </>
  );
};
