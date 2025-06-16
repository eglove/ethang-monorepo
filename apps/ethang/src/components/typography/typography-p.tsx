import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

type TypographyPProperties = {
  className?: string;
};

export const TypographyP = ({
  children,
  className,
}: Readonly<PropsWithChildren<TypographyPProperties>>) => {
  return (
    <p className={twMerge("leading-7 [&:not(:first-child)]:mt-6", className)}>
      {children}
    </p>
  );
};
