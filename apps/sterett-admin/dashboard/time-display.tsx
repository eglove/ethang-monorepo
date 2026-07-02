import { DateTime } from "effect";

type TimeDisplayProperties = {
  readonly date: string;
};

const formatDate = (date: string): string => {
  const dt = DateTime.unsafeMake(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  });
  return formatter.format(DateTime.toDate(dt));
};

export const TimeDisplay = ({ date }: TimeDisplayProperties) => {
  return (
    <time>
      <strong>{formatDate(date)}</strong>
    </time>
  );
};
