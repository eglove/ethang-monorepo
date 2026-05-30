import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { Blockquote, Box, Code, Em, Heading, Link, Strong, Text } from "@radix-ui/themes";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import SyntaxHighlighter from "react-syntax-highlighter";
// @ts-expect-error no types
import nightOwl from "react-syntax-highlighter/dist/esm/styles/hljs/night-owl.js";

import { sanityImage } from "../clients/sanity.ts";
import { HybridLink } from "./hybrid-link.tsx";

type BlockquoteFooterProperties = {
  author: string | undefined;
  source: string | undefined;
  sourceUrl: string | undefined;
};

const BlockquoteFooter = ({
  author,
  source,
  sourceUrl
}: BlockquoteFooterProperties) => {
  const hasAuthor = !isNil(author);
  const hasSource = !isNil(source);
  const hasSourceUrl = !isNil(sourceUrl);

  if (!hasAuthor && !hasSource) {
    return null;
  }

  return (
    <Text mt="2" asChild size="2">
      <footer>
        {"\u2014"} {author}
        {hasAuthor && hasSource && ", "}
        {hasSource &&
          (hasSourceUrl ? (
            <Link href={sourceUrl}>{source}</Link>
          ) : (
            <Text asChild size="2">
              <cite>{source}</cite>
            </Text>
          ))}
      </footer>
    </Text>
  );
};

const BlockStyleComponents: PortableTextComponents["block"] = {
  blockquote: ({ children, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const node = value as
      | { author?: string; source?: string; sourceUrl?: string }
      | undefined;

    return (
      <Blockquote>
        {children}
        <BlockquoteFooter
          author={node?.author}
          source={node?.source}
          sourceUrl={node?.sourceUrl}
        />
      </Blockquote>
    );
  },
  h2: ({ children }) => {
    return (
      <Heading mb="3" mt="4" as="h2" size="7">
        {children}
      </Heading>
    );
  },
  h3: ({ children }) => {
    return (
      <Heading mb="2" mt="3" as="h3" size="5">
        {children}
      </Heading>
    );
  },
  h4: ({ children }) => {
    return (
      <Heading mb="2" mt="2" as="h4" size="4">
        {children}
      </Heading>
    );
  },
  normal: ({ children }) => {
    return (
      <Text as="p" my="3" size="3">
        {children}
      </Text>
    );
  }
};

const MarkComponents: PortableTextComponents["marks"] = {
  code: ({ children }) => {
    return <Code>{children}</Code>;
  },
  em: ({ children }) => {
    return <Em>{children}</Em>;
  },
  link: ({ children, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const link = get(value, ["href"]) as string | undefined;
    const href = isString(link) ? link : "";

    return (
      // @ts-expect-error children type mismatch between PortableText ReactNode and HybridLink string
      <HybridLink href={href}>{children}</HybridLink>
    );
  },
  strong: ({ children }) => {
    return <Strong>{children}</Strong>;
  }
};

const QuoteRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as {
    author?: string;
    quote?: string;
    source?: string;
    sourceUrl?: string;
  };

  return (
    <Box mb="3" mt="3">
      <Blockquote>
        {node.quote}
        <BlockquoteFooter
          author={node.author}
          source={node.source}
          sourceUrl={node.sourceUrl}
        />
      </Blockquote>
    </Box>
  );
};

const CodeBlockRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as { code?: string; language?: string };

  if (isNil(node.code)) {
    return null;
  }

  return (
    <Box mb="3" mt="3">
      <SyntaxHighlighter
        PreTag="div"
        style={nightOwl}
        language={node.language ?? "typescript"}
      >
        {node.code}
      </SyntaxHighlighter>
    </Box>
  );
};

const IMAGE_MAX_WIDTH = 1200;

const ImageRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as {
    alt?: string;
    asset?: {
      metadata?: { dimensions?: { aspectRatio?: number; height?: number; width?: number } };
      url?: string;
    };
    caption?: string;
  };

  const assetUrl = node.asset?.url;
  if (isNil(assetUrl)) {
    return null;
  }

  const dimensions = node.asset?.metadata?.dimensions;
  const aspectRatio = dimensions?.aspectRatio;
  const width = dimensions?.width ?? IMAGE_MAX_WIDTH;
  const displayWidth = Math.min(width, IMAGE_MAX_WIDTH);
  const height = dimensions?.height ?? Math.round(displayWidth / (aspectRatio ?? 16 / 9));

  const src = sanityImage.image(assetUrl).width(IMAGE_MAX_WIDTH).fit("max").auto("format").url();

  return (
    <Box mb="3" mt="3">
      <img
        alt={node.alt ?? ""}
        height={height}
        loading="lazy"
        src={src}
        style={{ borderRadius: "var(--radius-4)", display: "block", margin: "0 auto", maxWidth: "100%" }}
        width={displayWidth}
      />
      {!isNil(node.caption) && (
        <Text align="center" asChild color="gray" mt="1" size="2">
          <figcaption>{node.caption}</figcaption>
        </Text>
      )}
    </Box>
  );
};

const VideoRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as { title?: string; videoId?: string };

  if (isNil(node.videoId)) {
    return null;
  }

  return (
    <Box mb="3" mt="3">
      <LiteYouTubeEmbed
        lazyLoad
        id={node.videoId}
        title={node.title ?? "YouTube video"}
      />
    </Box>
  );
};

const components: PortableTextComponents = {
  block: BlockStyleComponents,
  marks: MarkComponents,
  types: {
    blockquote: QuoteRenderer,
    code: CodeBlockRenderer,
    image: ImageRenderer,
    quote: QuoteRenderer,
    video: VideoRenderer
  }
};

// @ts-expect-error sanity
export const SanityText = ({ value }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return <PortableText value={value} components={components} />;
};
