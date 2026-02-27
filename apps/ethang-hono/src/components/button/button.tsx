import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

import { Link } from "../typography/link.tsx";
import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClasses,
} from "./button-classes.ts";

type ButtonProperties = PropsWithChildren<{
  as?: "a" | "button";
  className?: string;
  href?: string;
  id?: string;
  size?: ButtonSize;
  type: "button" | "reset" | "submit";
  variant?: ButtonVariant;
}>;

export const Button = async (properties: ButtonProperties) => {
  const {
    as,
    children,
    className,
    href,
    id,
    size = "base",
    type,
    variant = "default",
  } = properties;

  const classes = getButtonClasses(variant, size);

  if ("a" === as) {
    return (
      <Link href={href ?? "#"} className={twMerge(classes, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button id={id} type={type} class={twMerge(classes, className)}>
      {children}
    </button>
  );
};
