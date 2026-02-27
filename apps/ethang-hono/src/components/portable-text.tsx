import find from "lodash/find.js";
import flatMap from "lodash/flatMap.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import startsWith from "lodash/startsWith.js";

import type { BlogModelType } from "../models/blog-model-type.ts";

import { Image } from "../image.tsx";
import { Code } from "./code.tsx";
import { Blockquote } from "./typography/blockquote.tsx";
import { Link } from "./typography/link.tsx";
import { P } from "./typography/p.tsx";
import { YouTubeVideo } from "./you-tube-video.tsx";

type PortableTextProperties = {
  children: BlogModelType["body"];
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
            const isExternal =
              isString(markDefinition.href) &&
              (startsWith(markDefinition.href, "http") ||
                startsWith(markDefinition.href, "//"));

            // @ts-expect-error allow elements
            content = (
              <Link isExternal={isExternal} href={markDefinition.href}>
                {content}
              </Link>
            );
          }
        }
      }

      return content;
    });
  };

  const nodes = await Promise.all(
    map(children, async (block) => {
      if ("block" === block._type) {
        if ("normal" === block.style) {
          return <P>{renderChildren(block.children)}</P>;
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

  return <>{nodes}</>;
};
