import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

export const TypographyList = ({
  children,
  className,
}: Readonly<PropsWithChildren<{ className?: string }>>) => {
  return (
    <ul className={twMerge("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {children}
    </ul>
  );
};
