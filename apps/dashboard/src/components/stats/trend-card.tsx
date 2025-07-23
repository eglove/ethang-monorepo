import { Card } from "@heroui/react";

type TrendCardProperties = Readonly<{
  title: string;
  value: number | string;
}>;

export const TrendCard = ({ title, value }: TrendCardProperties) => {
  return (
    <Card className="border border-transparent dark:border-default-100">
      <div className="flex p-4">
        <div className="flex flex-col gap-y-2">
          <dt className="text-small font-medium text-default-500">{title}</dt>
          <dd className="text-2xl font-semibold text-default-700">{value}</dd>
        </div>
      </div>
    </Card>
  );
};
