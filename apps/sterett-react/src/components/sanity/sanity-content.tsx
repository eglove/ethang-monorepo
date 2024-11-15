import type { TypedObject } from "@portabletext/types";

import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import type { ImageAsset } from "../../types/sanity/image-asset.ts";

import { SanityPortableImage } from "./sanity-portable-image.tsx";

type SanityContentProperties = {
  readonly styleNames?: string;
  readonly value: TypedObject | TypedObject[];
};

const portableTextComponents = {
  types: {
    image({ value }) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const asset = value.asset as ImageAsset | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const altText = value.altText as string | undefined;
      if (!isNil(asset)) {
        return (
          <SanityPortableImage
            altText={altText ?? ""}
            image={asset}
          />
        );
      }

      return null;
    },
  },
} satisfies Partial<PortableTextReactComponents>;

export const SanityContent = ({
  styleNames, value,
}: SanityContentProperties) => {
  return (
    <div className={twMerge("prose", styleNames)}>
      <PortableText
        components={portableTextComponents}
        value={value}
      />
    </div>
  );
};
