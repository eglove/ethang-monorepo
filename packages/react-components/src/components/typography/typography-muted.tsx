import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyMutedProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyMuted = ({
  children, className,
}: Readonly<TypographyMutedProperties>) => {
  return (
    <p className={cn("text-muted-foreground text-sm", className)}>
      {children}
    </p>
  );
};
