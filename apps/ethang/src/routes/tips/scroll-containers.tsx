import times from "lodash/times.js";
import { Fragment } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { MainLayout } from "../../components/main-layout.tsx";
import { TypographyH1 } from "../../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../../components/typography/typography-h2.tsx";
import { TypographyP } from "../../components/typography/typography-p.tsx";

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

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <TypographyH1>Easy Sticky Header/Footer</TypographyH1>
      <TypographyP>
        A very simple approach to creating both a "sticky header" and "sticky
        footer" using grid.
      </TypographyP>
      <TypographyH2>CSS</TypographyH2>
      <div className="my-4">
        <SyntaxHighlighter language="css" style={nightOwl}>
          {cssExample}
        </SyntaxHighlighter>
      </div>
      <div className="my-4">
        <SyntaxHighlighter language="html" style={nightOwl}>
          {htmlExample}
        </SyntaxHighlighter>
      </div>
      <TypographyH2>Tailwind</TypographyH2>
      <div className="my-4">
        <SyntaxHighlighter language="html" style={nightOwl}>
          {tailwindExample}
        </SyntaxHighlighter>
      </div>
      <TypographyH2>Demo</TypographyH2>
      <div className="my-4 border-2 px-2 py-4 grid grid-rows-[auto_1fr_auto] gap-4">
        <div>
          <TypographyH2>Header</TypographyH2>
        </div>
        <div className="h-64 overflow-auto">
          {times(5, (index) => {
            return (
              <Fragment key={index}>
                <p className="leading-7">
                  Peter Piper picked a peck of pickled peppers.
                </p>
                <p className="leading-7">
                  A peck of pickled peppers Peter Piper picked.
                </p>
                <p className="leading-7">
                  If Peter Piper picked a peck of pickled peppers,
                </p>
                <p className="leading-7">
                  Where's the peck of pickled peppers Peter Piper picked?
                </p>
              </Fragment>
            );
          })}
        </div>
        <div className="my-4 border-t-2 pt-4">
          <div>Footer</div>
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
