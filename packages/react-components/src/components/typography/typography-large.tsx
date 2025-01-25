import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyLargeProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyLarge = ({
  children,
  className,
}: Readonly<TypographyLargeProperties>) => {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
};
