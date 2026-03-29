import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type ListProperties = PropsWithChildren<{ className?: string }>;

export const List = async (properties: ListProperties) => {
  return (
    <ul
      class={twMerge(
        "my-6 ml-6 list-disc [&>li]:mt-2 text-slate-200",
        properties.className,
      )}
    >
      {properties.children}
    </ul>
  );
};
