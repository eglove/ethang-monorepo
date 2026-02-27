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
      class="my-4 border-s-4 border-default bg-neutral-secondary-soft p-4"
    >
      <p class="text-xl leading-relaxed font-medium text-heading italic">
        {properties.children}
      </p>
      {hasAuthorOrSource && (
        <footer class="mt-2 text-sm text-neutral-500 not-italic">
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
