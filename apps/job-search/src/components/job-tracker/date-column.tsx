import isNil from "lodash/isNil";

type DateColumnProperties = Readonly<{
  date?: Date | null | undefined;
}>;

export const DateColumn = ({ date }: DateColumnProperties) => {
  if (isNil(date)) {
    return null;
  }

  return (
    <>
      {date.toLocaleString(undefined, {
        dateStyle: "medium",
      })}
    </>
  );
};
