import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { MainLayout } from "../../components/main-layout.tsx";
import { ScrollbarGutterDemo } from "../../components/tips/scrollbar-gutter-demo.tsx";
import { TypographyH1 } from "../../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../../components/typography/typography-h2.tsx";
import { TypographyP } from "../../components/typography/typography-p.tsx";

const scrollbarGutter = `html {
  scrollbar-gutter: stable both-edges;
}`;

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <Card>
        <CardHeader>
          <TypographyH1>scrollbar-gutter</TypographyH1>
        </CardHeader>
        <CardBody>
          <TypographyP>
            Avoid content layout shifts when moving from content without a
            scroll to content with a scroll.{" "}
            <Link
              isExternal
              showAnchorIcon
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter"
            >
              MDN
            </Link>{" "}
            <Link
              isExternal
              showAnchorIcon
              href="https://drafts.csswg.org/css-overflow/#scrollbar-gutter-property"
            >
              Spec
            </Link>
          </TypographyP>
          <TypographyP>
            <SyntaxHighlighter language="css" style={nightOwl}>
              {scrollbarGutter}
            </SyntaxHighlighter>
          </TypographyP>
          <TypographyH2 className="my-4">Demo</TypographyH2>
          <ScrollbarGutterDemo />
        </CardBody>
      </Card>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
