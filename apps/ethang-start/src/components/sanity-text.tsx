import {
  Blockquote,
  Code,
  CodeBlock,
  Heading,
  Link,
  Text
} from "@astryxdesign/core";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { Option, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

const MarkValueSchema = Schema.Struct({
  href: Schema.optional(Schema.String)
});

/**
Decodes the `href` property of a portable-text mark value. Returns the href
string when it is a string, otherwise `null`. Exported so tests can exercise
the decode logic directly without going through PortableText.
*/
export const decodeMarkHref = (value: unknown) => {
  const decoded = Schema.decodeUnknownOption(MarkValueSchema)(value);
  return Option.isSome(decoded) && isString(decoded.value.href)
    ? decoded.value.href
    : null;
};

/**
Footer renderer for blockquote-style portable-text blocks. Exported for
direct testing of the conditional layout branches.
*/
export type BlockquoteFooterProperties = {
  author: null | string;
  source: null | string;
  sourceUrl: null | string;
};

export const BlockquoteFooter = ({
  author,
  source,
  sourceUrl
}: Readonly<BlockquoteFooterProperties>) => {
  const hasAuthor = !isNil(author);
  const hasSource = !isNil(source);

  if (!hasAuthor && !hasSource) {
    return null;
  }

  const hasSourceUrl = !isNil(sourceUrl);

  return (
    <>
      {"\u{2014}"} {author}
      {hasAuthor && hasSource && ", "}
      {hasSource &&
        (hasSourceUrl ? <Link href={sourceUrl}>{source}</Link> : source)}
    </>
  );
};

const BlockStyleComponents: PortableTextComponents["block"] = {
  blockquote: ({ children, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const node = value as {
      author?: string;
      source?: string;
      sourceUrl?: string;
    } | null;

    return (
      <Blockquote
        cite={
          <BlockquoteFooter
            author={node?.author ?? null}
            source={node?.source ?? null}
            sourceUrl={node?.sourceUrl ?? null}
          />
        }
      >
        {children}
      </Blockquote>
    );
  },
  h2: ({ children }) => {
    return <Heading level={2}>{children}</Heading>;
  },
  h3: ({ children }) => {
    return <Heading level={3}>{children}</Heading>;
  },
  h4: ({ children }) => {
    return <Heading level={4}>{children}</Heading>;
  },
  normal: ({ children }) => {
    return <Text as="p">{children}</Text>;
  }
};

const MarkComponents: PortableTextComponents["marks"] = {
  code: ({ children }) => {
    return <Code>{children}</Code>;
  },
  em: ({ children }) => {
    return <Text weight="normal">{children}</Text>;
  },
  link: ({ children, value }) => {
    const href = decodeMarkHref(value) ?? "";

    if (!href) {
      return <>{children}</>;
    }

    return <Link href={href}>{children}</Link>;
  },
  strong: ({ children }) => {
    return <Text weight="bold">{children}</Text>;
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
    <Blockquote
      cite={
        <BlockquoteFooter
          author={node.author ?? null}
          source={node.source ?? null}
          sourceUrl={node.sourceUrl ?? null}
        />
      }
    >
      {node.quote}
    </Blockquote>
  );
};

const CodeBlockRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as { code?: string; language?: string };

  if (isNil(node.code)) {
    return null;
  }

  return (
    <CodeBlock code={node.code} language={node.language ?? "typescript"} />
  );
};

const IMAGE_MAX_WIDTH = 1200;

const ImageRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as {
    alt?: string;
    asset?: {
      metadata?: {
        dimensions?: { aspectRatio?: number; height?: number; width?: number };
      };
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
  const height =
    dimensions?.height ?? Math.round(displayWidth / (aspectRatio ?? 16 / 9));

  return (
    <div style={{ marginBottom: "12px", marginTop: "12px" }}>
      <img
        loading="lazy"
        src={assetUrl}
        height={height}
        alt={node.alt ?? ""}
        width={displayWidth}
        style={{
          borderRadius: "var(--radius-4)",
          display: "block",
          margin: "0 auto",
          maxWidth: "100%"
        }}
      />
      {!isNil(node.caption) && (
        <div className="text-secondary mt-1 text-center text-sm">
          <figcaption>{node.caption}</figcaption>
        </div>
      )}
    </div>
  );
};

const VideoRenderer = ({ value }: { value: unknown }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const node = value as { title?: string; videoId?: string };

  if (isNil(node.videoId)) {
    return null;
  }

  return (
    <div style={{ marginBottom: "12px", marginTop: "12px" }}>
      <LiteYouTubeEmbed
        lazyLoad
        id={node.videoId}
        title={node.title ?? "YouTube video"}
      />
    </div>
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
