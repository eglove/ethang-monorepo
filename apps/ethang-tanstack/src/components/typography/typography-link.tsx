import type { JSX, PropsWithChildren } from "react";

import { cn } from "@/lib/utils.ts";
import { Link, type LinkComponent } from "@tanstack/react-router";

type TypographyLinkProperties = LinkComponent<"a"> & Omit<JSX.IntrinsicElements["a"], "target"> & PropsWithChildren<{
  className?: string;
}>;

export const TypographyLink = ({
  children,
  className,
  ...rest
}: Readonly<TypographyLinkProperties>) => {
  return (
    <Link
      {...rest}
      className={cn("leading-7 underline underline-offset-2", className)}
      href={undefined}
      to={rest.href}
    >
      {children}
    </Link>
  );
};
