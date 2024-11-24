import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-separator";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";

const Separator = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(
  (
    // eslint-disable-next-line react/prefer-read-only-props
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
