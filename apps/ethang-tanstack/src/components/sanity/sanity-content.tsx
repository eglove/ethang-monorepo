import type { TypedObject } from "@portabletext/types";

import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { PortableText, type PortableTextReactComponents } from "@portabletext/react";
import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import type { ImageAsset } from "./sanity-types";

import { SanityPortableImage } from "./sanity-portable-image";

type SanityContentProperties = {
  readonly styleNames?: string;
  readonly value: TypedObject | TypedObject[];
};

const portableTextComponents: Partial<PortableTextReactComponents> = {
  block: {
    normal: TypographyP,
  },
  marks: {
    link({ children, value }) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const { href } = value as { href: string };

      return (
        <TypographyLink
          href={href}
        >
          {children}
        </TypographyLink>
      );
    },
  },
  types: {
    image({ value }) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
      const asset = value.asset as ImageAsset | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
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
};

export const SanityContent = ({
  styleNames, value,
}: SanityContentProperties) => {
  return (
    <div className={twMerge("text-foreground", styleNames)}>
      <PortableText
        components={portableTextComponents}
        value={value}
      />
    </div>
  );
};
