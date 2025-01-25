import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import {
  Anchor,
  Content,
  Portal,
  Root,
  Trigger,
} from "@radix-ui/react-popover";

const Popover = Root;

const PopoverTrigger = Trigger;

const PopoverAnchor = Anchor;

const PopoverContent = ({
  align = "center",
  className,
  sideOffset = 4,
  ...properties
}: Readonly<ComponentProps<typeof Content>>) => {
  return (
    <Portal>
      <Content
        className={cn(
          "z-50 w-72 rounded-md border border-neutral-200 bg-white p-4 text-neutral-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50",
          className,
        )}
        align={align}
        sideOffset={sideOffset}
        {...properties}
      />
    </Portal>
  );
};
PopoverContent.displayName = Content.displayName;

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
