import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type PProperties = PropsWithChildren<{ className?: string }>;

export const P = async (properties: PProperties) => {
  return (
    <p class={twMerge("my-3 text-body", properties.className)}>
      {properties.children}
    </p>
  );
};
