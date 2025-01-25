type TimeDisplayProperties = {
  readonly date: string;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });
};

export const TimeDisplay = ({ date }: TimeDisplayProperties) => {
  return (
    <time>
      <strong>{formatDate(date)}</strong>
    </time>
  );
};
