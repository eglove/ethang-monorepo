import { cn } from "@/lib/utils";
import { Content, Portal, Provider, Root, Trigger } from "@radix-ui/react-tooltip";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";

const TooltipProvider = Provider;

const Tooltip = Root;

const TooltipTrigger = Trigger;

const TooltipContent = forwardRef<
  Readonly<ComponentRef<typeof Content>>,
  Readonly<ComponentPropsWithoutRef<typeof Content>>
>(({ className, sideOffset = 4, ...properties }, reference) => {
  return (
    <Portal>
      <Content
        className={cn(
          "z-50 overflow-hidden rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-neutral-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-neutral-50 dark:text-neutral-900",
          className,
        )}
        ref={reference}
        sideOffset={sideOffset}
        {...properties}
      />
    </Portal>
  );
});
TooltipContent.displayName = Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
