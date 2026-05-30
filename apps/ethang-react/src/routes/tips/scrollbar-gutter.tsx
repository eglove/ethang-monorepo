/* eslint-disable a11y/no-noninteractive-tabindex */
import { Button, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Code } from "../../components/code.tsx";
import { HybridLink } from "../../components/hybrid-link.tsx";
import { MainLayout } from "../../components/layout/main-layout.tsx";

const scrollbarGutter = `html {
  scrollbar-gutter: stable both-edges;
}`;

const RouteComponent = () => {
  const [isExtraContentVisible, setIsExtraContentVisible] = useState(false);

  return (
    <MainLayout>
      <Heading as="h1" size="8">
        scrollbar-gutter
      </Heading>
      <Text as="p" my="3" size="3">
        Avoid content layout shifts when moving from content without a scroll to
        content with a scroll.{" "}
        <HybridLink href="https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter">
          MDN
        </HybridLink>{" "}
        <HybridLink href="https://drafts.csswg.org/css-overflow/#scrollbar-gutter-property">
          Spec
        </HybridLink>
      </Text>
      <Code language="css">{scrollbarGutter}</Code>
      <Heading mb="3" mt="4" as="h2" size="7">
        Demo
      </Heading>
      <div className="mt-4">
        <Button
          className="mb-4"
          onClick={() => {
            setIsExtraContentVisible(!isExtraContentVisible);
          }}
        >
          {isExtraContentVisible ? "Hide extra content" : "Show Extra Content"}
        </Button>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-gray-700 p-4">
            <div className="mb-2 font-semibold text-slate-200">
              With scrollbar-gutter
            </div>
            <section
              tabIndex={0}
              style={{ scrollbarGutter: "stable" }}
              aria-label="With scrollbar-gutter demo"
              className="h-100 overflow-auto rounded-md border border-gray-700 p-4"
            >
              <Text as="p" size="3">
                This container has <code>scrollbar-gutter: stable</code>{" "}
                applied.
              </Text>
              <Text as="p" size="3">
                When content exceeds the container height, a scrollbar appears
                without shifting the content.
              </Text>
              {isExtraContentVisible && (
                <div>
                  <Text as="p" size="3">
                    Additional content to trigger scrollbar...
                  </Text>
                  <Text as="p" size="3">
                    Notice how the content width remains stable when the
                    scrollbar appears.
                  </Text>
                  <Text as="p" size="3">
                    The scrollbar takes up space that was already reserved for
                    it.
                  </Text>
                  <Text as="p" size="3">
                    This prevents the layout from shifting when the scrollbar
                    appears.
                  </Text>
                  <Text as="p" size="3">
                    More content to ensure scrolling...
                  </Text>
                  <Text as="p" size="3">
                    Even more content to ensure scrolling...
                  </Text>
                  <Text as="p" size="3">
                    Final line of additional content.
                  </Text>
                </div>
              )}
            </section>
          </div>
          <div className="rounded-md border border-gray-700 p-4">
            <div className="mb-2 font-semibold text-slate-200">
              Without scrollbar-gutter
            </div>
            <section
              tabIndex={0}
              style={{ scrollbarGutter: "auto" }}
              aria-label="Without scrollbar-gutter demo"
              className="h-100 overflow-auto rounded-md border border-gray-700 p-4"
            >
              <Text as="p" size="3">
                This container does not have scrollbar-gutter applied.
              </Text>
              <Text as="p" size="3">
                When content exceeds the container height, a scrollbar appears
                and shifts the content.
              </Text>
              {isExtraContentVisible && (
                <div>
                  <Text as="p" size="3">
                    Additional content to trigger scrollbar...
                  </Text>
                  <Text as="p" size="3">
                    Notice how the content width changes when the scrollbar
                    appears.
                  </Text>
                  <Text as="p" size="3">
                    The scrollbar takes up space that was previously used for
                    content.
                  </Text>
                  <Text as="p" size="3">
                    This causes the layout to shift when the scrollbar appears.
                  </Text>
                  <Text as="p" size="3">
                    More content to ensure scrolling...
                  </Text>
                  <Text as="p" size="3">
                    Even more content to ensure scrolling...
                  </Text>
                  <Text as="p" size="3">
                    Final line of additional content.
                  </Text>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/tips/scrollbar-gutter")({
  component: RouteComponent
});
