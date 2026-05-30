/* eslint-disable a11y/no-noninteractive-tabindex */
import { Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import times from "lodash/times";

import { Code } from "../../components/code.tsx";
import { MainLayout } from "../../components/layout/main-layout.tsx";

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
    <MainLayout>
      <Heading as="h1" size="8">
        Easy Sticky Header/Footer
      </Heading>
      <Text as="p" my="3" size="3">
        A very simple approach to creating both a "sticky header" and "sticky
        footer" using grid.
      </Text>
      <Heading mb="3" mt="4" as="h2" size="7">
        CSS
      </Heading>
      <Code language="css">{cssExample}</Code>
      <Code language="html">{htmlExample}</Code>
      <Heading mb="3" mt="4" as="h2" size="7">
        Tailwind
      </Heading>
      <Code language="html">{tailwindExample}</Code>
      <Heading mb="3" mt="4" as="h2" size="7">
        Demo
      </Heading>
      <div className="my-4 grid grid-rows-[auto_1fr_auto] gap-4 border-2 border-gray-700 px-2 py-4">
        <Heading as="h2" size="6" className="border-b border-gray-700 pb-4">
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
                <Text as="p" size="3" className="leading-7">
                  Peter Piper picked a peck of pickled peppers.
                </Text>
                <Text as="p" size="3" className="leading-7">
                  A peck of pickled peppers Peter Piper picked.
                </Text>
                <Text as="p" size="3" className="leading-7">
                  If Peter Piper picked a peck of pickled peppers,
                </Text>
                <Text as="p" size="3" className="leading-7">
                  Where's the peck of pickled peppers Peter Piper picked?
                </Text>
              </div>
            );
          })}
        </section>
        <div className="my-4 border-t border-gray-700 pt-4">
          <Text as="p" size="3">
            Footer
          </Text>
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/tips/scroll-containers")({
  component: RouteComponent
});
