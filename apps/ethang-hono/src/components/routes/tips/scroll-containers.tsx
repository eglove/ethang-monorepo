// eslint-disable-next-line cspell/spellchecker
/* eslint-disable a11y/no-noninteractive-tabindex */
import times from "lodash/times.js";

import { DEPLOY_TIME } from "../../../utilities/deploy-info.ts";
import { Code } from "../../code.tsx";
import { BlogLayout } from "../../layouts/blog-layout.tsx";
import { H1 } from "../../typography/h1.tsx";
import { H2 } from "../../typography/h2.tsx";
import { P } from "../../typography/p.tsx";

const cssExample = `.container {
  display: grid;
  height: 100vb;
  grid-template-rows: auto 1fr auto;
}

.content {
  overflow: auto;
}`;

const htmlExample = `<div class="container">
  <header>Header</header>
  <main class="content">Content</main>
  <footer>Footer</footer>
</div>`;

const tailwindExample = `<div class="grid h-[100vb] grid-rows-[auto_1fr_auto]">
  <header>Header</header>
  <main class="overflow-auto">Content</main>
  <footer>Footer</footer>
</div>`;

export const ScrollContainers = async () => {
  return (
    <BlogLayout updatedAt={DEPLOY_TIME} title="Easy Sticky Header/Footer">
      <H1>Easy Sticky Header/Footer</H1>
      <P>
        A very simple approach to creating both a "sticky header" and "sticky
        footer" using grid.
      </P>
      <H2>CSS</H2>
      <Code language="css">{cssExample}</Code>
      <Code language="html">{htmlExample}</Code>
      <H2>Tailwind</H2>
      <Code language="html">{tailwindExample}</Code>
      <H2>Demo</H2>
      <div className="border-body my-4 grid grid-rows-[auto_1fr_auto] gap-4 border-2 px-2 py-4">
        <H2 className="border-b pb-4">Header</H2>
        <section
          tabindex={0}
          className="h-64 overflow-auto"
          aria-label="Scroll container demo"
        >
          {times(5, async () => {
            return (
              <>
                <P className="leading-7">
                  Peter Piper picked a peck of pickled peppers.
                </P>
                <P className="leading-7">
                  A peck of pickled peppers Peter Piper picked.
                </P>
                <P className="leading-7">
                  If Peter Piper picked a peck of pickled peppers,
                </P>
                <P className="leading-7">
                  Where's the peck of pickled peppers Peter Piper picked?
                </P>
              </>
            );
          })}
        </section>
        <div className="border-t-body my-4 border-t pt-4">
          <P>Footer</P>
        </div>
      </div>
    </BlogLayout>
  );
};
