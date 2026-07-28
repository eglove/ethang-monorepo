import { toHTML } from "@portabletext/to-html";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import map from "lodash/map.js";
import matches from "lodash/matches.js";

type PortableTextProperties = {
  content: null | Parameters<typeof toHTML>[0];
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
    const imageBlocks = filter(blocks, matches({ _type: "image" }));
    await Promise.all(
      map(imageBlocks, async (block) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const imageBlock = block as SanityImageBlock;
        return imageHtmlMap.set(
          imageBlock._key,
          await buildImageHtml(imageBlock)
        );
      })
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
              image: ({ value }: { value: { _key: string } }) => {
                return imageHtmlMap.get(value._key) ?? "";
              }
            }
          }
        })
      }}
    />
  );
};
