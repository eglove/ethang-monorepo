import type { TypedObject } from "@portabletext/types";

import { Link } from "@nextui-org/link";
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
  marks: {
    link({ children, value }) {
      const { href } = value as { href: string };

      return (
        <Link
          isExternal
          href={href}
        >
          {children}
        </Link>
      );
    },
  },
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
};

export const SanityContent = ({
  styleNames, value,
}: SanityContentProperties) => {
  return (
    <div className={twMerge("prose text-foreground", styleNames)}>
      <PortableText
        components={portableTextComponents}
        value={value}
      />
    </div>
  );
};
