import type { PropsWithChildren } from "hono/jsx";

import { twMerge } from "tailwind-merge";

type PProperties = PropsWithChildren<{ className?: string; id?: string }>;

export const P = async (properties: PProperties) => {
  return (
    <p
      id={properties.id}
      class={twMerge(
        "leading-7 not-first:mt-6 text-slate-200",
        properties.className,
      )}
    >
      {properties.children}
    </p>
  );
};
