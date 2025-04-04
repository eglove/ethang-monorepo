import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

export const TypographyH4 = ({
  children,
  className,
}: Readonly<PropsWithChildren<{ className?: string }>>) => {
  return (
    <h4
      className={twMerge(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className,
      )}
    >
      {children}
    </h4>
  );
};
