import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H1Properties = PropsWithChildren<{
  className?: string;
}>;

export const H1 = async (properties: H1Properties) => {
  return (
    <h1
      class={twMerge(
        "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance text-heading",
        properties.className,
      )}
    >
      {properties.children}
    </h1>
  );
};
