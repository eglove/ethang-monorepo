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
        class="flex w-full cursor-pointer items-center justify-between gap-3 border border-x-0 border-t-0 border-b-default bg-neutral-primary p-5 font-medium text-body hover:bg-neutral-secondary-medium hover:text-heading rtl:text-right"
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
          class="h-5 w-5 shrink-0 rotate-180"
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
