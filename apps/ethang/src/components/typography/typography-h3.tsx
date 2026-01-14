import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

type TypographyH3Properties = {
  children: ReactNode;
  className?: string;
};

export const TypographyH3 = ({
  children,
  className,
}: Readonly<TypographyH3Properties>) => {
  return (
    <h3
      className={twMerge(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
};
