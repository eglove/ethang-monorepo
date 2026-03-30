import type { Child } from "hono/jsx";

import filter from "lodash/filter.js";
import find from "lodash/find.js";
import flatMap from "lodash/flatMap.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import type { GetBlogBySlug } from "../models/get-blog-by-slug.ts";

import { Image } from "../image.tsx";
import { Code } from "./code.tsx";
import { Blockquote } from "./typography/blockquote.tsx";
import { H2 } from "./typography/h2.tsx";
import { H3 } from "./typography/h3.tsx";
import { InlineCode } from "./typography/inline-code.tsx";
import { Link } from "./typography/link.tsx";
import { List } from "./typography/list.tsx";
import { P } from "./typography/p.tsx";
import { YouTubeVideo } from "./you-tube-video.tsx";

type Block = Body[number];
type BlockChildren = NonNullable<Block["children"]>;
type Body = GetBlogBySlug["body"];

type MarkDefinition = { _key: string; _type: string; href?: string };

type PortableTextProperties = {
  children: Body;
};

type RenderContext = {
  allChildren: Body;
  renderChildren: (nodeChildren: BlockChildren | undefined) => Child[] | null;
};

const STYLE_RENDERERS: Record<
  string,
  (block: Block, context: RenderContext) => Child
> = {
  blockquote: (block, context): Child => (
    // @ts-expect-error ignore
    <Blockquote
      author={block.author}
      source={block.source}
      sourceUrl={block.sourceUrl}
    >
      {context.renderChildren(block.children)}
    </Blockquote>
  ),
  h2: (block, context): Child => (
    <H2>{context.renderChildren(block.children)}</H2>
  ),
  h3: (block, context): Child => (
    <H3 className="mt-4">{context.renderChildren(block.children)}</H3>
  ),
  normal: (block, context): Child => (
    <P>{context.renderChildren(block.children)}</P>
  ),
};

const renderImageBlock = (block: Block): Child => {
  if (isNil(block.asset?.url)) {
    return null;
  }

  return (
    // @ts-expect-error ignore
    <Image
      alt={block.alt ?? ""}
      src={block.asset.url}
      caption={block.caption}
      width={block.asset.metadata.dimensions.width}
      height={block.asset.metadata.dimensions.height}
    />
  );
};

const renderCodeBlock = (block: Block): Child => {
  if (isNil(block.code)) {
    return null;
  }

  return <Code language={block.language ?? "typescript"}>{block.code}</Code>;
};

const renderVideoBlock = (block: Block): Child => {
  if (isNil(block.videoId)) {
    return null;
  }

  return <YouTubeVideo videoId={block.videoId} title={block.title ?? ""} />;
};

const renderQuoteBlock = (block: Block): Child => {
  if (isNil(block.quote)) {
    return null;
  }

  return (
    // @ts-expect-error ignore
    <Blockquote
      author={block.author}
      source={block.source}
      sourceUrl={block.sourceUrl}
    >
      {block.quote}
    </Blockquote>
  );
};

const TYPE_RENDERERS: Record<
  string,
  (block: Block, context: RenderContext) => Child
> = {
  blockquote: renderQuoteBlock, // Sanity "blockquote" _type — same renderer as "quote"
  code: renderCodeBlock,
  image: renderImageBlock,
  quote: renderQuoteBlock, // Sanity "quote" _type — same renderer as "blockquote"
  video: renderVideoBlock,
};

const applyMark = (
  content: Child,
  mark: string,
  markDefs: MarkDefinition[],
): { content: Child; done: boolean } => {
  if ("code" === mark) {
    return { content: <InlineCode>{content}</InlineCode>, done: true };
  }

  const markDefinition = find(markDefs, (definition) => {
    return definition._key === mark;
  });

  if ("link" === markDefinition?._type) {
    return {
      content: <Link href={markDefinition.href ?? ""}>{content}</Link>,
      done: false,
    };
  }

  return { content, done: false };
};

const resolveMarkedText = async (
  text: string,
  marks: string[],
  markDefs: MarkDefinition[],
): Promise<Child> => {
  let content: Child = text;

  for (const mark of marks) {
    const { content: updated, done } = applyMark(content, mark, markDefs);
    content = updated;
    if (done) return content;
  }

  return content;
};

const renderBlockChildren = (
  nodeChildren: BlockChildren,
  allMarkDefs: MarkDefinition[],
): Child[] => {
  // @ts-expect-error -- hono's Child only includes Promise<string>, but async children are supported at runtime
  return map(nodeChildren, async (child) => {
    if (0 < child.marks.length) {
      return resolveMarkedText(child.text, child.marks, allMarkDefs);
    }

    return child.text;
  });
};

const renderStyledBlock = (block: Block, context: RenderContext): Child => {
  const styleRenderer = STYLE_RENDERERS[block.style ?? ""];
  return styleRenderer ? styleRenderer(block, context) : null;
};

const renderNonBlockType = (block: Block, context: RenderContext): Child => {
  const typeRenderer = TYPE_RENDERERS[block._type];
  return typeRenderer ? typeRenderer(block, context) : null;
};

export const PortableText = async ({ children }: PortableTextProperties) => {
  const allMarkDefs = flatMap(children, (block) => {
    return (block.markDefs ?? []) as MarkDefinition[];
  });

  const renderChildren = (
    nodeChildren: BlockChildren | undefined,
  ): Child[] | null => {
    if (isNil(nodeChildren)) {
      return null;
    }

    return renderBlockChildren(nodeChildren, allMarkDefs);
  };

  const context: RenderContext = { allChildren: children, renderChildren };
  let blockItems: Child[] = [];
  const nodes: Child[] = [];

  const flushList = () => {
    if (0 < blockItems.length) {
      const copy = [...blockItems];
      blockItems = [];
      nodes.push(<List>{copy}</List>);
    }
  };

  const processListBlock = (block: Block) => {
    blockItems.push(<li>{renderChildren(block.children)}</li>);
  };

  const processStyledBlock = (block: Block) => {
    flushList();
    const node = renderStyledBlock(block, context);
    if (!isNil(node)) nodes.push(node);
  };

  const processTypedBlock = (block: Block) => {
    flushList();
    const node = renderNonBlockType(block, context);
    if (!isNil(node)) nodes.push(node);
  };

  for (const block of children) {
    if ("block" === block._type) {
      if (isString(block.listItem)) {
        processListBlock(block);
      } else {
        processStyledBlock(block);
      }
    } else {
      processTypedBlock(block);
    }
  }

  flushList();

  return <>{filter(nodes, (value) => !isNil(value))}</>;
};
