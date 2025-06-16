import { Button } from "@heroui/react";
import { useState } from "react";

import { TypographyP } from "../typography/typography-p.tsx";

export const ScrollbarGutterDemo = () => {
  const [showMoreContent, setShowMoreContent] = useState(false);

  const toggleContent = () => {
    setShowMoreContent((previous) => !previous);
  };

  return (
    <div className="mt-4">
      <Button className="mb-4" color="primary" onPress={toggleContent}>
        {showMoreContent ? "Hide Extra Content" : "Show Extra Content"}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="mb-2 font-semibold">With scrollbar-gutter</div>
          <div
            className="h-[400px] overflow-auto p-4 border rounded-md"
            style={{ scrollbarGutter: "stable" }}
          >
            <TypographyP>
              This container has <code>scrollbar-gutter: stable</code> applied.
            </TypographyP>
            <TypographyP>
              When content exceeds the container height, a scrollbar appears
              without shifting the content.
            </TypographyP>

            {showMoreContent && (
              <>
                <TypographyP>
                  Additional content to trigger scrollbar...
                </TypographyP>
                <TypographyP>
                  Notice how the content width remains stable when the scrollbar
                  appears.
                </TypographyP>
                <TypographyP>
                  The scrollbar takes up space that was already reserved for it.
                </TypographyP>
                <TypographyP>
                  This prevents the layout from shifting when the scrollbar
                  appears.
                </TypographyP>
                <TypographyP>More content to ensure scrolling...</TypographyP>
                <TypographyP>
                  Even more content to ensure scrolling...
                </TypographyP>
                <TypographyP>Final line of additional content.</TypographyP>
              </>
            )}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <div className="mb-2 font-semibold">Without scrollbar-gutter</div>
          <div
            className="h-[400px] overflow-auto p-4 border rounded-md"
            style={{ scrollbarGutter: "auto" }}
          >
            <TypographyP>
              This container does not have scrollbar-gutter applied.
            </TypographyP>
            <TypographyP>
              When content exceeds the container height, a scrollbar appears and
              shifts the content.
            </TypographyP>

            {showMoreContent && (
              <>
                <TypographyP>
                  Additional content to trigger scrollbar...
                </TypographyP>
                <TypographyP>
                  Notice how the content width changes when the scrollbar
                  appears.
                </TypographyP>
                <TypographyP>
                  The scrollbar takes up space that was previously used for
                  content.
                </TypographyP>
                <TypographyP>
                  This causes the layout to shift when the scrollbar appears.
                </TypographyP>
                <TypographyP>More content to ensure scrolling...</TypographyP>
                <TypographyP>
                  Even more content to ensure scrolling...
                </TypographyP>
                <TypographyP>Final line of additional content.</TypographyP>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
