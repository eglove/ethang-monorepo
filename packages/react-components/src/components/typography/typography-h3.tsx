import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyH3Properties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyH3 = ({
  children, className,
}: Readonly<TypographyH3Properties>) => {
  return (
    <h1 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}>
      {children}
    </h1>
  );
};
