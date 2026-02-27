import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H2Properties = PropsWithChildren<{
  className?: string;
}>;

export const H2 = async (properties: H2Properties) => {
  return (
    <h1
      class={twMerge(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight text-heading wrap-break-word mt-4",
        properties.className,
      )}
    >
      {properties.children}
    </h1>
  );
};
