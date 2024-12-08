import type {
  ComponentProps,
} from "react";

import { cn } from "@/lib/utils";
import { Content, Portal, Provider, Root, Trigger } from "@radix-ui/react-tooltip";

const TooltipProvider = Provider;

const Tooltip = Root;

const TooltipTrigger = Trigger;

const TooltipContent = ({
  className, sideOffset = 4, ...properties
}: Readonly<ComponentProps<typeof Content>>) => {
  return (
    <Portal>
      <Content
        className={
          cn(
            "z-50 overflow-hidden rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-neutral-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-neutral-50 dark:text-neutral-900",
            className,
          )
        }
        sideOffset={sideOffset}
        {...properties}
      />
    </Portal>
  );
};
TooltipContent.displayName = Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
