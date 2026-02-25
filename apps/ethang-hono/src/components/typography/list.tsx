import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type ListProperties = PropsWithChildren<{ className?: string }>;

export const List = async (properties: ListProperties) => {
  return (
    <ul
      class={twMerge(
        "max-w-md space-y-2 text-body list-none list-inside",
        properties.className,
      )}
    >
      {properties.children}
    </ul>
  );
};
