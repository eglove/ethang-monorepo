import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

type TypographyBlockquoteProperties = {
  className?: string;
};

export const TypographyBlockquote = ({
  children,
  className,
}: Readonly<PropsWithChildren<TypographyBlockquoteProperties>>) => {
  return (
    <blockquote className={twMerge("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
};
