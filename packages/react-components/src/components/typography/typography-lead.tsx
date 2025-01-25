import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyLeadProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyLead = ({
  children,
  className,
}: Readonly<TypographyLeadProperties>) => {
  return (
    <p className={cn("text-muted-foreground text-xl", className)}>{children}</p>
  );
};
