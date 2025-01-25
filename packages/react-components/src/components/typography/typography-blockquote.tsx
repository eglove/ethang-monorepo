import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";

type TypographyBlockquoteProperties = PropsWithChildren<{
  className?: string;
}>;

export const TypographyBlockQuote = ({
  children,
  className,
}: Readonly<TypographyBlockquoteProperties>) => {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
};
