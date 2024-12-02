import { cva } from "class-variance-authority";

import type { SolidNode } from "../../types/solid-node";

const sizes = {
  default: "h-9 px-4 py-2",
  icon: "size-9",
  lg: "h-10 rounded-md px-8",
  sm: "h-8 rounded-md px-3 text-xs",
};

const variants = {
  default: "bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90",
  destructive: "bg-red-600 text-neutral-50 shadow-sm hover:bg-red-600/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90",
  ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
  link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
  outline: "border border-neutral-200 bg-white shadow-sm hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
  secondary: "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
};

type ButtonStyledProperties = {
  children: SolidNode;
  size?: keyof typeof sizes;
  variant?: keyof typeof variants;
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-neutral-300 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: sizes,
      variant: variants,
    },
  },
);

export const ButtonStyled = (properties: ButtonStyledProperties) => {
  return (
    <button
      class={buttonVariants({
        size: properties.size,
        variant: properties.variant,
      })}
      type="button"
    >
      {properties.children}
    </button>
  );
};
