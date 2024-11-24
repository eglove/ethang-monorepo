import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographySmallProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographySmall = ({
  children, className,
}: Readonly<TypographySmallProperties>) => {
  return (
    <small className={cn("text-sm font-medium leading-none", className)}>
      {children}
    </small>
  );
};
