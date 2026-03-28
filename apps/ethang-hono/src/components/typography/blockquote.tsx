import type { PropsWithChildren } from "hono/jsx";

import isNil from "lodash/isNil.js";

import { Link } from "./link.tsx";

type BlockquoteProperties = PropsWithChildren<{
  author?: string;
  source?: string;
  sourceUrl?: string;
}>;

export const Blockquote = async (properties: BlockquoteProperties) => {
  const hasAuthor = !isNil(properties.author);
  const hasSource = !isNil(properties.source);
  const hasAuthorAndSource = hasAuthor && hasSource;
  const hasAuthorOrSource = hasAuthor || hasSource;

  return (
    <blockquote
      cite={properties.sourceUrl}
      class="border-default bg-neutral-secondary-soft mt-6 border-l-2 p-4 ps-6"
    >
      <p class="text-heading leading-7 italic">{properties.children}</p>
      {hasAuthorOrSource && (
        <footer class="text-body mt-2 text-sm not-italic">
          - {hasAuthor && <span>{properties.author}</span>}
          {hasAuthorAndSource && ", "}
          {hasSource && (
            <cite>
              {isNil(properties.sourceUrl) ? (
                properties.source
              ) : (
                <Link href={properties.sourceUrl}>{properties.source}</Link>
              )}
            </cite>
          )}
        </footer>
      )}
    </blockquote>
  );
};
