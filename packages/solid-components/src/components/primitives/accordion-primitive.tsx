import filter from "lodash/filter";
import includes from "lodash/includes";
import { animate } from "motion";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { twMerge } from "tailwind-merge";

import type { SolidNode } from "../../types/solid-node";

import { prefersReducedMotion } from "../../util/a11y";

export type AccordionPrimitiveProperties = {
  classNames?: {
    button?: string;
    contentInner?: string;
    contentOuter?: string;
    heading?: string;
    innerContainer?: string;
  };
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  isAnimating?: boolean;
  items: {
    content: SolidNode;
    heading: SolidNode;
  }[];
};

export const AccordionPrimitive = (
  properties: AccordionPrimitiveProperties,
) => {
  const [openItems, setOpenItems] = createSignal<number[]>([]);

  const isAnimating = createMemo(() => {
    return !prefersReducedMotion && false !== properties.isAnimating;
  });

  const headingLevel = createMemo(() => {
    return properties.headingLevel ?? "h3";
  });

  const toggleItem = (item: number) => {
    if (includes(openItems(), item)) {
      setOpenItems((previous) => {
        return filter(previous, (index) => {
          return index !== item;
        });
      });
    } else {
      setOpenItems((previous) => {
        return [...previous, item];
      });
    }
  };

  return (
    <For each={properties.items}>
      {(item, index) => {
        createEffect(() => {
          if (!isAnimating()) {
            return;
          }

          if (includes(openItems(), index())) {
            animate(`#content${index()}`, {
              height: "auto",
              opacity: 1,
            }, { duration: 0.2 });
          } else {
            animate(`#content${index()}`, {
              height: 0,
              opacity: 0,
            }, { duration: 0.2 });
          }
        });

        return (
          <div class={twMerge(properties.classNames?.innerContainer)}>
            <Dynamic
              class={twMerge(properties.classNames?.heading)}
              component={headingLevel()}
            >
              <button
                onClick={() => {
                  toggleItem(index());
                }}
                aria-controls={`content${index()}`}
                aria-expanded={includes(openItems(), index())}
                class={twMerge(properties.classNames?.button)}
                id={`header${index()}`}
                type="button"
              >
                {item.heading}
              </button>
            </Dynamic>
            <section
              class={twMerge(
                isAnimating() && "h-0 opacity-0",
                properties.classNames?.contentOuter,
              )}
              hidden={
                !isAnimating() &&
                !includes(openItems(), index()) && "hidden"
              }
              aria-hidden={!includes(openItems(), index())}
              aria-labelledby={`header${index()}`}
              id={`content${index()}`}
            >
              <div class={properties.classNames?.contentInner}>
                {item.content}
              </div>
            </section>
          </div>
        );
      }}
    </For>
  );
};
