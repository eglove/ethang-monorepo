import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type LinkProperties = PropsWithChildren<{
  className?: string;
  href: string;
  isExternal?: boolean;
}>;

export const Link = async (properties: LinkProperties) => {
  return (
    <a
      href={properties.href}
      target={true === properties.isExternal ? "_blank" : undefined}
      rel={true === properties.isExternal ? "noopener noreferrer" : undefined}
      class={twMerge(
        "font-medium text-fg-brand hover:underline",
        properties.className,
      )}
    >
      {properties.children}
    </a>
  );
};
