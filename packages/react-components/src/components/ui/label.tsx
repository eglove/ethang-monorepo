"use client";

import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = forwardRef<
  ComponentRef<typeof Root>,
  Readonly<ComponentPropsWithoutRef<typeof Root> &
  VariantProps<typeof labelVariants>>
>(({
  className,
  ...properties
}, reference) => {
  return (
    <Root
      className={cn(labelVariants(), className)}
      ref={reference}
      {...properties}
    />
  );
});
Label.displayName = Root.displayName;

export { Label };
