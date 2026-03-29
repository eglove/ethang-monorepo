import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

import { globalStore } from "../../stores/global-store-properties.ts";

type LinkProperties = PropsWithChildren<{
  "aria-label"?: string;
  className?: string;
  href: string;
}>;

export const Link = async (properties: LinkProperties) => {
  let isExternal = false;

  if (
    URL.canParse(properties.href) &&
    globalStore.origin !== new URL(properties.href).origin
  ) {
    isExternal = true;
  }

  return (
    <a
      href={properties.href}
      aria-label={properties["aria-label"]}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      class={twMerge(
        "font-medium text-sky-300 hover:underline",
        properties.className,
      )}
    >
      {properties.children}
    </a>
  );
};
