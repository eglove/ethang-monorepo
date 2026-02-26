import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H2Properties = PropsWithChildren<{
  className?: string;
}>;

export const H2 = async (properties: H2Properties) => {
  return (
    <h1
      class={twMerge(
        "text-4xl font-bold text-heading wrap-break-word",
        properties.className,
      )}
    >
      {properties.children}
    </h1>
  );
};
