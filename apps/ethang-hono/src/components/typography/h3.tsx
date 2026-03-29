import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H3Properties = PropsWithChildren<{
  className?: string;
}>;

export const H3 = async (properties: H3Properties) => {
  return (
    <h3
      class={twMerge(
        "scroll-m-20 text-2xl font-semibold tracking-tight text-slate-100 font-heading",
        properties.className,
      )}
    >
      {properties.children}
    </h3>
  );
};
