import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyInlineCodeProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyInlineCode = ({
  children, className,
}: Readonly<TypographyInlineCodeProperties>) => {
  return (
    <code className={cn("bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}>
      {children}
    </code>
  );
};
