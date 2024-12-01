import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyH4Properties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyH4 = ({
  children, className,
}: Readonly<TypographyH4Properties>) => {
  return (
    <h1 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}>
      {children}
    </h1>
  );
};
