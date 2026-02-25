import type { PropsWithChildren } from "hono/jsx";

type AccordionHeaderProperties = PropsWithChildren<{
  bodyId: string;
  classNames?: {
    childrenWrapper?: string;
  };
  headingId: string;
}>;

export const AccordionHeader = async (
  properties: AccordionHeaderProperties,
) => {
  return (
    <h2 class="border-b" id={properties.headingId}>
      <button
        type="button"
        aria-expanded="false"
        aria-controls={properties.bodyId}
        data-accordion-target={`#${properties.bodyId}`}
        class="bg-neutral-primary flex items-center justify-between w-full p-5 font-medium rtl:text-right text-body border border-x-0 border-b-default border-t-0 hover:text-heading hover:bg-neutral-secondary-medium gap-3 cursor-pointer"
      >
        <span class={properties.classNames?.childrenWrapper}>
          {properties.children}
        </span>
        <svg
          width="24"
          fill="none"
          height="24"
          aria-hidden="true"
          data-accordion-icon
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5 rotate-180 shrink-0"
        >
          <path
            stroke-width="2"
            d="m5 15 7-7 7 7"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </h2>
  );
};
