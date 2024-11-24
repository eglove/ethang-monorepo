type SkillGaugeProperties = {
  readonly label: string;
  readonly maxYears: number;
  readonly years: number;
};

const getColor = (years: number, maxYears: number) => {
  let color: string;

  if (maxYears * 0.33 > years) {
    color = "cyan";
  } else if (maxYears * 0.66 > years) {
    color = "teal";
  } else {
    color = "green";
  }

  return color;
};

export const SkillGauge = ({
  label, maxYears, years,
}: SkillGaugeProperties) => {
  const color = getColor(years, maxYears);

  return (
    <div className="relative size-40">
      <svg
        className="rotate-135 size-full"
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={`text-${color}-200 stroke-current dark:text-neutral-700`}
          cx="18"
          cy="18"
          fill="none"
          r="16"
          strokeDasharray="75 100"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <circle
          className={`text-${color}-500 dark:text-${color}-500 stroke-current`}
          cx="18"
          cy="18"
          fill="none"
          r="16"
          strokeDasharray={`${years / maxYears * 75} 100`}
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <span className={`text-${color}-600 dark:text-${color}-500 text-4xl font-bold`}>
          {years}
        </span>
        <span className={`text-${color}-600 dark:text-${color}-500 block`}>
          {label}
        </span>
      </div>
    </div>
  );
};
