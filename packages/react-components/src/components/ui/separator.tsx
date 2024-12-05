import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-separator";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";

const Separator = forwardRef<
  ComponentRef<typeof Root>,
  Readonly<ComponentPropsWithoutRef<typeof Root>>
>(
  (
    { className, decorative = true, orientation = "horizontal", ...properties },
    reference,
  ) => {
    return (
      <Root
        className={cn(
          "shrink-0 bg-neutral-200 dark:bg-neutral-800",
          "horizontal" === orientation
            ? "h-[1px] w-full"
            : "h-full w-[1px]",
          className,
        )}
        decorative={decorative}
        orientation={orientation}
        ref={reference}
        {...properties}
      />
    );
  },
);
Separator.displayName = Root.displayName;

export { Separator };
