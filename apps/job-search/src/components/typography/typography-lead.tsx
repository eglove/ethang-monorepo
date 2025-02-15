import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

export const TypographyLead = ({
  children,
  className,
}: Readonly<PropsWithChildren<{ className?: string }>>) => {
  return (
    <p className={twMerge("text-xl text-muted-foreground", className)}>
      {children}
    </p>
  );
};
