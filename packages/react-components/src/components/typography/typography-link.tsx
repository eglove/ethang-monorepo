import { cn } from "@/lib/utils.ts";
import { Link, type LinkComponent } from "@tanstack/react-router";
import isString from "lodash/isString.js";
import {
  type JSX,
  type PropsWithChildren,
  useMemo,
} from "react";

type TypographyLinkProperties = LinkComponent<"a"> & Omit<JSX.IntrinsicElements["a"], "target"> & PropsWithChildren<{
  className?: string;
}>;

export const TypographyLink = ({
  children,
  className,
  ...rest
}: Readonly<TypographyLinkProperties>) => {
  const isExternal = useMemo(() => {
    if (isString(rest.href) && URL.canParse(rest.href) && "undefined" !== typeof globalThis) {
      const url = new URL(rest.href);
      const baseUrl = new URL(globalThis.location.href);

      if (baseUrl.host !== url.host) {
        return true;
      }
    }

    return false;
  }, [rest.href]);

  return (
    <Link
      {...rest}
      target={
        isExternal
          ? "_blank"
          : ""
      }
      className={cn("leading-7 underline underline-offset-2", className)}
      href={undefined}
      to={rest.href}
    >
      {children}
    </Link>
  );
};
