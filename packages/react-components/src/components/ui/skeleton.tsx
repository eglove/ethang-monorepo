import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const Skeleton = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-700 dark:bg-neutral-50/10",
        className,
      )}
      {...properties}
    />
  );
};

export { Skeleton };
