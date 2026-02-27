import { Button } from "../../button/button.tsx";
import { Code } from "../../code.tsx";
import { BlogLayout } from "../../layouts/blog-layout.tsx";
import { H1 } from "../../typography/h1.tsx";
import { H2 } from "../../typography/h2.tsx";
import { Link } from "../../typography/link.tsx";
import { P } from "../../typography/p.tsx";

const scrollbarGutter = `html {
  scrollbar-gutter: stable both-edges;
}`;

export const ScrollbarGutter = async () => {
  return (
    <BlogLayout title="scrollbar-gutter">
      <H1>scrollbar-gutter</H1>
      <P>
        Avoid content layout shifts when moving from content without a scroll to
        content with a scroll.{" "}
        <Link
          className="underline"
          href="https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter"
        >
          MDN
        </Link>{" "}
        <Link
          className="underline"
          href="https://drafts.csswg.org/css-overflow/#scrollbar-gutter-property"
        >
          Spec
        </Link>
      </P>
      <P>
        <Code language="css">{scrollbarGutter}</Code>
      </P>
      <H2>Demo</H2>
      <div class="mt-4">
        <script type="module" src="/scripts/tips/scrollbar-gutter.js"></script>
        <Button
          type="button"
          className="mb-4"
          id="scrollbar-gutter-show-extra-content"
        >
          Show Extra Content
        </Button>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-body p-4">
            <div className="mb-2  font-semibold text-body">
              With scrollbar-gutter
            </div>
            <div
              style={{ scrollbarGutter: "stable" }}
              className="h-100 overflow-auto rounded-md border border-body p-4"
            >
              <P>
                This container has <code>scrollbar-gutter: stable</code>{" "}
                applied.
              </P>
              <P>
                When content exceeds the container height, a scrollbar appears
                without shifting the content.
              </P>
              <div class="hidden" id="scrollbar-gutter-with-example">
                <P>Additional content to trigger scrollbar...</P>
                <P>
                  Notice how the content width remains stable when the scrollbar
                  appears.
                </P>
                <P>
                  The scrollbar takes up space that was already reserved for it.
                </P>
                <P>
                  This prevents the layout from shifting when the scrollbar
                  appears.
                </P>
                <P>More content to ensure scrolling...</P>
                <P>Even more content to ensure scrolling...</P>
                <P>Final line of additional content.</P>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-body p-4">
            <div className="mb-2 font-semibold text-body">
              Without scrollbar-gutter
            </div>
            <div
              style={{ scrollbarGutter: "auto" }}
              className="h-100 overflow-auto rounded-md border border-body p-4"
            >
              <P>This container does not have scrollbar-gutter applied.</P>
              <P>
                When content exceeds the container height, a scrollbar appears
                and shifts the content.
              </P>
              <div class="hidden" id="scrollbar-gutter-without-example">
                <P>Additional content to trigger scrollbar...</P>
                <P>
                  Notice how the content width changes when the scrollbar
                  appears.
                </P>
                <P>
                  The scrollbar takes up space that was previously used for
                  content.
                </P>
                <P>
                  This causes the layout to shift when the scrollbar appears.
                </P>
                <P>More content to ensure scrolling...</P>
                <P>Even more content to ensure scrolling...</P>
                <P>Final line of additional content.</P>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BlogLayout>
  );
};
