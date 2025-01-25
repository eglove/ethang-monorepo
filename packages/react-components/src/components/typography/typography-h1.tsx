import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyH1Properties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyH1 = ({
  children,
  className,
}: Readonly<TypographyH1Properties>) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className,
      )}
    >
      {children}
    </h1>
  );
};
