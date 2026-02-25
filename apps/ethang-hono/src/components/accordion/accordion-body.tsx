import type { PropsWithChildren } from "hono/jsx";

type AccordionBodyProperties = PropsWithChildren<{
  bodyId: string;
  headingId: string;
}>;

export const AccordionBody = async (properties: AccordionBodyProperties) => {
  return (
    <div
      id={properties.bodyId}
      aria-labelledby={properties.headingId}
      class="hidden border border-s-0 border-e-0 border-t-0 border-b-default"
    >
      <div class="p-4 text-body md:p-5">{properties.children}</div>
    </div>
  );
};
