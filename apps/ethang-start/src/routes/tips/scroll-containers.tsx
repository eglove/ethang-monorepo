/* eslint-disable a11y/no-noninteractive-tabindex */
import { Badge, CodeBlock, Heading, Text } from "@astryxdesign/core";
import { createFileRoute } from "@tanstack/react-router";
import times from "lodash/times.js";

import { MainLayout } from "../../components/layouts/main-layout.tsx";

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

export const Route = createFileRoute("/tips/scroll-containers")({
  component: ScrollContainersPage
});

function ScrollContainersPage() {
  return (
    <MainLayout>
      <div data-testid="tips-page" className="flex flex-col gap-8">
        <Heading level={1}>Easy Sticky Header/Footer</Heading>
        <Text as="p">
          A very simple approach to creating both a "sticky header" and "sticky
          footer" using grid.
        </Text>
        <section>
          <Heading level={2}>CSS</Heading>
          <div className="mt-4 flex flex-col gap-4">
            <CodeBlock language="css" code={cssExample} />
            <CodeBlock language="html" code={htmlExample} />
          </div>
        </section>
        <section>
          <Heading level={2}>Tailwind</Heading>
          <div className="mt-4">
            <CodeBlock language="html" code={tailwindExample} />
          </div>
        </section>
        <section>
          <Heading level={2}>Demo</Heading>
          <Text as="p" className="my-4">
            Scroll the middle panel. The Header and Footer stay fixed while the
            content area scrolls.
          </Text>
          <div
            data-testid="scroll-containers-demo"
            className="grid w-full max-w-lg grid-rows-[auto_1fr_auto] gap-4 rounded-md border border-gray-700 bg-slate-900/60 p-4"
          >
            <div className="flex flex-col gap-2 rounded-md bg-cyan-950 p-3">
              <Badge label="Header" variant="cyan" />
              <Text as="p" className="text-cyan-200">
                Fixed at the top — stays put while the middle area scrolls.
              </Text>
            </div>
            <section
              tabIndex={0}
              aria-label="Scroll container demo"
              className="h-64 overflow-auto rounded-md bg-slate-800/80 p-4"
            >
              <Badge variant="neutral" label="Scrollable content" />
              {times(5, (index) => {
                return (
                  <div key={index}>
                    <Text as="p" className="leading-7">
                      Peter Piper picked a peck of pickled peppers.
                    </Text>{" "}
                    <Text as="p" className="leading-7">
                      A peck of pickled peppers Peter Piper picked.
                    </Text>{" "}
                    <Text as="p" className="leading-7">
                      If Peter Piper picked a peck of pickled peppers,
                    </Text>{" "}
                    <Text as="p" className="leading-7">
                      Where&apos;s the peck of pickled peppers Peter Piper
                      picked?
                    </Text>
                  </div>
                );
              })}
            </section>
            <div className="flex flex-col gap-2 rounded-md bg-cyan-950 p-3">
              <Badge label="Footer" variant="cyan" />
              <Text as="p" className="text-cyan-200">
                Fixed at the bottom — stays put while the middle area scrolls.
              </Text>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
