import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

import type { SolidNode } from "../../types/solid-node";

type BadgeStyledProperties = {
  children: SolidNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
};

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:focus:ring-neutral-300",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border-transparent bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/80 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/80",
        destructive: "border-transparent bg-red-600 text-neutral-50 shadow hover:bg-red-600/80 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/80",
        outline: "text-neutral-900 dark:text-neutral-50",
        secondary: "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
      },
    },
  },
);

export const BadgeStyled = (properties: BadgeStyledProperties) => {
  return (
    <div class={twMerge(badgeVariants({ variant: properties.variant }))}>
      {properties.children}
    </div>
  );
};
