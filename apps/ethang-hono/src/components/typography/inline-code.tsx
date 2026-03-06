import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type InlineCodeProperties = PropsWithChildren<{
  className?: string;
}>;

export const InlineCode = async (properties: InlineCodeProperties) => {
  return (
    <code
      className={twMerge(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        properties.className,
      )}
    >
      {properties.children}
    </code>
  );
};
