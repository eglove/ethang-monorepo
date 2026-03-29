import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H2Properties = PropsWithChildren<{
  className?: string;
}>;

export const H2 = async (properties: H2Properties) => {
  return (
    <h2
      class={twMerge(
        "scroll-m-20 border-b border-slate-600 pb-2 text-3xl font-semibold tracking-tight text-slate-100 font-heading wrap-break-word mt-4",
        properties.className,
      )}
    >
      {properties.children}
    </h2>
  );
};
