import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyH2Properties = Readonly<
  {
    className?: string;
  } & PropsWithChildren
>;

export const TypographyH2 = ({
  children,
  className,
}: TypographyH2Properties) => {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
    >
      {children}
    </h2>
  );
};
