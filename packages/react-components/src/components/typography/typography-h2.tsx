import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyH2Properties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyH2 = ({
  children, className,
}: Readonly<TypographyH2Properties>) => {
  return (
    <h1 className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", className)}>
      {children}
    </h1>
  );
};
