import type { PropsWithChildren } from "hono/jsx";

import { v7 } from "uuid";

export const AccordionWrapper = async (properties: PropsWithChildren) => {
  const id = `accordion-${v7()}`;

  return (
    <div
      id={id}
      data-accordion="collapse"
      class="overflow-hidden rounded-base border shadow-xs"
    >
      {properties.children}
    </div>
  );
};
