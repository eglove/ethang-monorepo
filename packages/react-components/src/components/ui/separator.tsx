import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-separator";

const Separator = ({
  className,
  decorative = true,
  orientation = "horizontal",
  ...properties
}: Readonly<ComponentPropsWithoutRef<typeof Root>>) => {
  return (
    <Root
      className={cn(
        "shrink-0 bg-neutral-200 dark:bg-neutral-800",
        "horizontal" === orientation ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      decorative={decorative}
      orientation={orientation}
      {...properties}
    />
  );
};
Separator.displayName = Root.displayName;

export { Separator };
