import {
  TypographyBlockQuote,
} from "./typography-blockquote.tsx";
import { TypographyH1 } from "./typography-h1.tsx";
import { TypographyH2 } from "./typography-h2.tsx";
import { TypographyH3 } from "./typography-h3.tsx";
import { TypographyH4 } from "./typography-h4.tsx";
import {
  TypographyInlineCode,
} from "./typography-inline-code.tsx";
import { TypographyLarge } from "./typography-large.tsx";
import { TypographyLead } from "./typography-lead.tsx";
import { TypographyList } from "./typography-list.tsx";
import { TypographyMuted } from "./typography-muted.tsx";
import { TypographyP } from "./typography-p.tsx";
import { TypographySmall } from "./typography-small.tsx";

export default {
  title: "typography",
};

export const Headings = () => {
  return (
    <div>
      <TypographyH1>
        Heading H1
      </TypographyH1>
      <TypographyH2>
        Heading H2
      </TypographyH2>
      <TypographyH3>
        Heading H3
      </TypographyH3>
      <TypographyH4>
        Heading H4
      </TypographyH4>
    </div>
  );
};

export const Sizes = () => {
  return (
    <div>
      <TypographyLead>
        Leading
      </TypographyLead>
      <TypographyLarge>
        Large
      </TypographyLarge>
      <TypographySmall>
        Small
      </TypographySmall>
    </div>
  );
};

export const BlockQuote = () => {
  return (
    <TypographyBlockQuote>
      Sunsets are cool
    </TypographyBlockQuote>
  );
};

export const InlineCode = () => {
  return (
    <TypographyInlineCode>
      pnpm install
    </TypographyInlineCode>
  );
};

export const List = () => {
  return (
    <TypographyList items={[
      <li key="1">
        Item 1
      </li>,
      <li key="2">
        Item 2
      </li>,
      <li key="3">
        Item 3
      </li>,
    ]}
    />
  );
};

export const Muted = () => {
  return (
    <TypographyMuted>
      Muted
    </TypographyMuted>
  );
};

export const Paragraph = () => {
  return (
    <TypographyP>
      I am a paragraph.
    </TypographyP>
  );
};
