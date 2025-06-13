import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

type TypographyH1Properties = { className?: string } & PropsWithChildren;

export const TypographyH1 = ({
  children,
  className,
}: Readonly<TypographyH1Properties>) => {
  return (
    <h2
      className={twMerge(
        "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
        className,
      )}
    >
      {children}
    </h2>
  );
};
