import { cn } from "@/lib/utils";
import { type ComponentProps, forwardRef } from "react";

const Input = forwardRef<
  Readonly<HTMLInputElement>,
  Readonly<ComponentProps<"input">>
>(
  // eslint-disable-next-line react/prefer-read-only-props
  ({ className, type, ...properties }, reference) => {
    return (
      <input
        className={cn(
          "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-neutral-800 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
          className,
        )}
        ref={reference}
        type={type}
        {...properties}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
