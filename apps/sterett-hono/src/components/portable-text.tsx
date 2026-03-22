import { toHTML } from "@portabletext/to-html";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import map from "lodash/map.js";

type PortableTextProperties = {
  content: Parameters<typeof toHTML>[0] | undefined;
};

type SanityImageBlock = {
  _key: string;
  _type: "image";
  altText: string;
  asset?: {
    _id: string;
    metadata: {
      dimensions: {
        height: number;
        width: number;
      };
      lqip: string;
    };
    url: string;
  };
};

const buildImageHtml = async (block: SanityImageBlock) => {
  return (
    <div class="w-full">
      <img
        loading="lazy"
        alt={block.altText}
        src={block.asset?.url}
        class="relative max-h-96"
        width={block.asset?.metadata.dimensions.width}
        height={block.asset?.metadata.dimensions.height}
      />
    </div>
  );
};

export const PortableText = async ({ content }: PortableTextProperties) => {
  const blocks = content ?? [];

  // Pre-process all image blocks asynchronously before calling toHTML
  const imageHtmlMap = new Map<string, string>();

  if (isArray(blocks)) {
    await Promise.all(
      map(
        filter(
          blocks,
          (block): block is SanityImageBlock => "image" === block._type,
        ),
        async (block) => {
          imageHtmlMap.set(block._key, await buildImageHtml(block));
        },
      ),
    );
  }

  return (
    <div
      class="prose prose-invert"
      dangerouslySetInnerHTML={{
        __html: toHTML(blocks, {
          components: {
            types: {
              // toHTML handlers must be synchronous and return HTML strings
              image: ({ value }: { value: { _key: string } }) =>
                imageHtmlMap.get(value._key) ?? "",
            },
          },
        }),
      }}
    />
  );
};
