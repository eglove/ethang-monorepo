/* eslint-disable a11y/no-noninteractive-tabindex */
import { CodeBlock, Heading, Text } from "@astryxdesign/core";
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
      <Heading level={1}>Easy Sticky Header/Footer</Heading>
      <Text as="p" my={3} size="sm">
        A very simple approach to creating both a "sticky header" and "sticky
        footer" using grid.
      </Text>
      <Heading mt={4} mb={3} level={2}>
        CSS
      </Heading>
      <CodeBlock code={cssExample} language="css" />
      <CodeBlock code={htmlExample} language="html" />
      <Heading mt={4} mb={3} level={2}>
        Tailwind
      </Heading>
      <CodeBlock code={tailwindExample} language="html" />
      <Heading mt={4} mb={3} level={2}>
        Demo
      </Heading>
      <div className="my-4 grid grid-rows-[auto_1fr_auto] gap-4 border-2 border-gray-700 px-2 py-4">
        <Heading level={2} className="border-b border-gray-700 pb-4">
          Header
        </Heading>
        <section
          tabIndex={0}
          className="h-64 overflow-auto"
          aria-label="Scroll container demo"
        >
          {times(5, (index) => {
            return (
              <div key={index}>
                <Text as="p" size="sm" className="leading-7">
                  Peter Piper picked a peck of pickled peppers.
                </Text>
                <Text as="p" size="sm" className="leading-7">
                  A peck of pickled peppers Peter Piper picked.
                </Text>
                <Text as="p" size="sm" className="leading-7">
                  If Peter Piper picked a peck of pickled peppers,
                </Text>
                <Text as="p" size="sm" className="leading-7">
                  Where&apos;s the peck of pickled peppers Peter Piper picked?
                </Text>
              </div>
            );
          })}
        </section>
        <div className="my-4 border-t border-gray-700 pt-4">
          <Text as="p" size="sm">
            Footer
          </Text>
        </div>
      </div>
    </MainLayout>
  );
}
