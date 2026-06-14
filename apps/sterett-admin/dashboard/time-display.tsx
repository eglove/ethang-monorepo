import { DateTime } from "luxon";

type TimeDisplayProperties = {
  readonly date: string;
};

const formatDate = (date: string): string => {
  return DateTime.fromISO(date).toLocaleString({
    dateStyle: "medium"
  });
};

export const TimeDisplay = ({ date }: TimeDisplayProperties) => {
  return (
    <time>
      <strong>{formatDate(date)}</strong>
    </time>
  );
};
