/* eslint-disable a11y/no-noninteractive-tabindex */
import {
  Badge,
  Button,
  CodeBlock,
  Heading,
  Link,
  Text
} from "@astryxdesign/core";
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
      <div data-testid="tips-page" className="flex flex-col gap-8">
        <Heading level={1}>scrollbar-gutter</Heading>
        <Text as="p" className="text-sm">
          Avoid content layout shifts when moving from content without a scroll
          to content with a scroll.{""}
          <Link
            isExternalLink
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter"
          >
            MDN
          </Link>
          {""}
          <Link
            isExternalLink
            href="https://drafts.csswg.org/css-overflow/#scrollbar-gutter-property"
          >
            Spec
          </Link>
        </Text>
        <CodeBlock language="css" code={scrollbarGutter} />
        <section>
          <Heading level={2}>Demo</Heading>
          <Text as="p" className="my-4 text-sm">
            Click the button to add content to both panels. The panel on the
            left reserves gutter space up front; the panel on the right does
            not.
          </Text>
          <div className="mt-4">
            <Button
              onClick={() => {
                setIsExtraContentVisible(!isExtraContentVisible);
              }}
              label={
                isExtraContentVisible
                  ? "Hide extra content"
                  : "Show Extra Content"
              }
            />
            <div
              data-testid="scrollbar-gutter-demo"
              className="mt-4 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="rounded-md border border-emerald-700 bg-emerald-950/40 p-4">
                <div className="mb-3">
                  <Badge variant="success" label="With scrollbar-gutter" />
                </div>
                <section
                  tabIndex={0}
                  style={{ scrollbarGutter: "stable" }}
                  aria-label="With scrollbar-gutter demo"
                  className="h-60 overflow-auto rounded-md border border-emerald-800 bg-slate-900/60 p-4"
                >
                  <Text as="p">
                    This container has <code>scrollbar-gutter: stable</code>{" "}
                    applied.
                  </Text>
                  <Text as="p">
                    When content exceeds the container height, a scrollbar
                    appears without shifting the content.
                  </Text>
                  {isExtraContentVisible && (
                    <div>
                      <Text as="p">
                        Additional content to trigger scrollbar...
                      </Text>
                      <Text as="p">
                        Notice how the content width remains stable when the
                        scrollbar appears.
                      </Text>
                      <Text as="p">
                        The scrollbar takes up space that was already reserved
                        for it.
                      </Text>
                      <Text as="p">
                        This prevents the layout from shifting when the
                        scrollbar appears.
                      </Text>
                      <Text as="p">More content to ensure scrolling...</Text>
                      <Text as="p">
                        Even more content to ensure scrolling...
                      </Text>
                      <Text as="p">Final line of additional content.</Text>
                    </div>
                  )}
                </section>
                <Text as="p" className="mt-3 text-emerald-300">
                  Content stays fixed — the gutter space is reserved up front.
                </Text>
              </div>
              <div className="rounded-md border border-amber-700 bg-amber-950/40 p-4">
                <div className="mb-3">
                  <Badge variant="warning" label="Without scrollbar-gutter" />
                </div>
                <section
                  tabIndex={0}
                  style={{ scrollbarGutter: "auto" }}
                  aria-label="Without scrollbar-gutter demo"
                  className="h-60 overflow-auto rounded-md border border-amber-800 bg-slate-900/60 p-4"
                >
                  <Text as="p">
                    This container does not have scrollbar-gutter applied.
                  </Text>
                  <Text as="p">
                    When content exceeds the container height, a scrollbar
                    appears and shifts the content.
                  </Text>
                  {isExtraContentVisible && (
                    <div>
                      <Text as="p">
                        Additional content to trigger scrollbar...
                      </Text>
                      <Text as="p">
                        Notice how the content width changes when the scrollbar
                        appears.
                      </Text>
                      <Text as="p">
                        The scrollbar takes up space that was previously used
                        for content.
                      </Text>
                      <Text as="p">
                        This causes the layout to shift when the scrollbar
                        appears.
                      </Text>
                      <Text as="p">More content to ensure scrolling...</Text>
                      <Text as="p">
                        Even more content to ensure scrolling...
                      </Text>
                      <Text as="p">Final line of additional content.</Text>
                    </div>
                  )}
                </section>
                <Text as="p" className="mt-3 text-amber-300">
                  Content shifts sideways when the scrollbar appears.
                </Text>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
