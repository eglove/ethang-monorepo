import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyPProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyP = ({
  children, className,
}: Readonly<TypographyPProperties>) => {
  return (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
      {children}
    </p>
  );
};
