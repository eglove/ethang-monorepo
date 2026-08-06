/* eslint-disable a11y/no-noninteractive-tabindex */
import { Button, CodeBlock, Heading, Link, Text } from "@astryxdesign/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MainLayout } from "../../components/layouts/main-layout.tsx";

const scrollbarGutter = `html {
  scrollbar-gutter: stable both-edges;
}`;

export const Route = createFileRoute("/tips/scrollbar-gutter")({
  component: ScrollbarGutterPage
});

function ScrollbarGutterPage() {
  const [isExtraContentVisible, setIsExtraContentVisible] = useState(false);

  return (
    <MainLayout>
      <Heading level={1}>scrollbar-gutter</Heading>
      <Text as="p" my={3} size="sm">
        Avoid content layout shifts when moving from content without a scroll to
        content with a scroll.{" "}
        <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter" isExternalLink>
          MDN
        </Link>{" "}
        <Link href="https://drafts.csswg.org/css-overflow/#scrollbar-gutter-property" isExternalLink>
          Spec
        </Link>
      </Text>
      <CodeBlock code={scrollbarGutter} language="css" />
      <Heading mt={4} mb={3} level={2}>
        Demo
      </Heading>
      <div className="mt-4">
        <Button
          label={isExtraContentVisible ? "Hide extra content" : "Show Extra Content"}
          onClick={() => {
            setIsExtraContentVisible(!isExtraContentVisible);
          }}
          className="mb-4"
        />

        <div className="grid grid-cols-2 gap-4">
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
              <Text as="p" size="sm">
                This container has <code>scrollbar-gutter: stable</code>{" "}
                applied.
              </Text>
              <Text as="p" size="sm">
                When content exceeds the container height, a scrollbar appears
                without shifting the content.
              </Text>
              {isExtraContentVisible && (
                <div>
                  <Text as="p" size="sm">
                    Additional content to trigger scrollbar...
                  </Text>
                  <Text as="p" size="sm">
                    Notice how the content width remains stable when the
                    scrollbar appears.
                  </Text>
                  <Text as="p" size="sm">
                    The scrollbar takes up space that was already reserved for
                    it.
                  </Text>
                  <Text as="p" size="sm">
                    This prevents the layout from shifting when the scrollbar
                    appears.
                  </Text>
                  <Text as="p" size="sm">
                    More content to ensure scrolling...
                  </Text>
                  <Text as="p" size="sm">
                    Even more content to ensure scrolling...
                  </Text>
                  <Text as="p" size="sm">
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
              <Text as="p" size="sm">
                This container does not have scrollbar-gutter applied.
              </Text>
              <Text as="p" size="sm">
                When content exceeds the container height, a scrollbar appears
                and shifts the content.
              </Text>
              {isExtraContentVisible && (
                <div>
                  <Text as="p" size="sm">
                    Additional content to trigger scrollbar...
                  </Text>
                  <Text as="p" size="sm">
                    Notice how the content width changes when the scrollbar
                    appears.
                  </Text>
                  <Text as="p" size="sm">
                    The scrollbar takes up space that was previously used for
                    content.
                  </Text>
                  <Text as="p" size="sm">
                    This causes the layout to shift when the scrollbar appears.
                  </Text>
                  <Text as="p" size="sm">
                    More content to ensure scrolling...
                  </Text>
                  <Text as="p" size="sm">
                    Even more content to ensure scrolling...
                  </Text>
                  <Text as="p" size="sm">
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
}
