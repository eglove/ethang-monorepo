"use client";

import type {
  ComponentProps,
} from "react";

import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = ({
  className,
  ...properties
}: Readonly<ComponentProps<typeof Root> &
VariantProps<typeof labelVariants>>) => {
  return (
    <Root
      className={cn(labelVariants(), className)}
      {...properties}
    />
  );
};
Label.displayName = Root.displayName;

export { Label };
