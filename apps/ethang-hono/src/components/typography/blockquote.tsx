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
      class="mt-6 rounded-r-lg border-l-[3px] border-sky-300 bg-sky-300/10 p-4 ps-6"
    >
      <p class="leading-7 text-slate-100 italic">{properties.children}</p>
      {hasAuthorOrSource && (
        <footer class="mt-2 text-sm text-slate-200 not-italic">
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
