import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type H1Properties = PropsWithChildren<{
  className?: string;
}>;

export const H1 = async (properties: H1Properties) => {
  return (
    <h1
      class={twMerge("text-5xl font-bold text-heading", properties.className)}
    >
      {properties.children}
    </h1>
  );
};
