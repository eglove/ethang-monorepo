import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

export const TypographyH3 = ({
  children,
  className,
}: Readonly<PropsWithChildren<{ className?: string }>>) => {
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
