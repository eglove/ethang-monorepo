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
import { Link } from "./typography/link.tsx";
import { List } from "./typography/list.tsx";
import { P } from "./typography/p.tsx";
import { YouTubeVideo } from "./you-tube-video.tsx";

type PortableTextProperties = {
  children: GetBlogBySlug["body"];
};

export const PortableText = async ({ children }: PortableTextProperties) => {
  const renderChildren = (
    nodeChildren: (typeof children)[number]["children"],
  ) => {
    if (isNil(nodeChildren)) {
      return null;
    }

    return map(nodeChildren, (child) => {
      let content = child.text;

      if (0 < child.marks.length) {
        for (const mark of child.marks) {
          const markDefinition = find(
            flatMap(children, (block) => {
              return block.markDefs ?? [];
            }),
            (definition) => {
              return definition._key === mark;
            },
          );

          if ("link" === markDefinition?._type) {
            // @ts-expect-error allow elements
            content = <Link href={markDefinition.href}>{content}</Link>;
          }
        }
      }

      return content;
    });
  };

  let blockItems: Child[] = [];

  const nodes: Child[] = await Promise.all(
    // eslint-disable-next-line sonar/cognitive-complexity
    map(children, async (block) => {
      if ("block" === block._type) {
        if (isString(block.listItem)) {
          blockItems.push(<li>{renderChildren(block.children)}</li>);
          return null;
        }

        if (!isString(block.listItem) && 0 < blockItems.length) {
          const copy = [...blockItems];
          blockItems = [];
          return <List>{copy}</List>;
        }

        if ("normal" === block.style) {
          return <P>{renderChildren(block.children)}</P>;
        }

        if ("h2" === block.style) {
          return <H2>{renderChildren(block.children)}</H2>;
        }

        if ("h3" === block.style) {
          return <H3>{renderChildren(block.children)}</H3>;
        }

        if ("blockquote" === block.style) {
          return (
            // @ts-expect-error ignore
            <Blockquote
              author={block.author}
              source={block.source}
              sourceUrl={block.sourceUrl}
            >
              {renderChildren(block.children)}
            </Blockquote>
          );
        }
      }

      if ("image" === block._type && !isNil(block.asset?.url)) {
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
      }

      if ("code" === block._type && !isNil(block.code)) {
        return (
          <Code language={block.language ?? "typescript"}>{block.code}</Code>
        );
      }

      if ("video" === block._type && !isNil(block.videoId)) {
        return (
          <YouTubeVideo videoId={block.videoId} title={block.title ?? ""} />
        );
      }

      if (
        ("blockquote" === block._type || "quote" === block._type) &&
        !isNil(block.quote)
      ) {
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
      }

      return null;
    }),
  );

  if (0 < blockItems.length) {
    nodes.push(<List>{blockItems}</List>);
  }

  return <>{filter(nodes, (value) => !isNil(value))}</>;
};
