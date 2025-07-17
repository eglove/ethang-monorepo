import isNumber from "lodash/isNumber.js";

type AppearanceCountProperties = {
  amount: number | undefined;
  label: string;
};

export const AppearanceCount = ({
  amount,
  label,
}: Readonly<AppearanceCountProperties>) => {
  if (!isNumber(amount) || 0 >= amount) {
    return null;
  }

  return (
    <p className="text-center">
      {label}: {amount}
    </p>
  );
};
