"use client";

import type { ComponentPropsWithoutRef, Ref } from "react";

import { cn } from "@/lib/utils";
import { Root } from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export type LabelProperties = Readonly<
  {
    ref?: Ref<HTMLLabelElement>;
  } & ComponentPropsWithoutRef<typeof Root> &
    VariantProps<typeof labelVariants>
>;

const Label = ({ className, ref, ...properties }: LabelProperties) => (
  <Root className={cn(labelVariants(), className)} ref={ref} {...properties} />
);
Label.displayName = Root.displayName;

export { Label };
