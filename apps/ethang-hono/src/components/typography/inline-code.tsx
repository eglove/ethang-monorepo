import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type InlineCodeProperties = PropsWithChildren<{
  className?: string;
}>;

export const InlineCode = async (properties: InlineCodeProperties) => {
  return (
    <code
      className={twMerge(
        "relative rounded bg-slate-700 border border-slate-600 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-sky-300",
        properties.className,
      )}
    >
      {properties.children}
    </code>
  );
};
