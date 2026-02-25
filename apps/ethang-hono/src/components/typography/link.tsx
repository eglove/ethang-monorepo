import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type LinkProperties = PropsWithChildren<{
  className?: string;
  href: string;
  target?: string;
}>;

export const Link = async (properties: LinkProperties) => {
  return (
    <a
      href={properties.href}
      target={properties.target}
      class={twMerge(
        "font-medium text-fg-brand hover:underline",
        properties.className,
      )}
    >
      {properties.children}
    </a>
  );
};
