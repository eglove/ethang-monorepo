import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

type TypographyH2Properties = { className?: string };

export const TypographyH2 = ({
  children,
  className,
}: Readonly<PropsWithChildren<TypographyH2Properties>>) => {
  return (
    <h2
      className={twMerge(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
    >
      {children}
    </h2>
  );
};
