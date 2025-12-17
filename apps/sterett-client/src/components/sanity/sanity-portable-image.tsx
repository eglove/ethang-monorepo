import { SanityImage } from "sanity-image";

import type { ImageAsset } from "../../types/sanity/image-asset.ts";

import { sanityImage } from "../../clients/sanity/sanity-client.ts";

const IMAGE_SIZE = 600;

type SanityPortableImageProperties = {
  readonly altText: string;
  readonly image: ImageAsset;
};

export const SanityPortableImage = ({
  altText,
  image,
}: SanityPortableImageProperties) => {
  const imageUrl = sanityImage
    .image(image.url)
    .maxWidth(IMAGE_SIZE)
    .format("webp")
    .url();

  return (
    <div>
      <SanityImage
        alt={altText}
        id={image._id}
        mode="contain"
        crop={image.crop}
        baseUrl={imageUrl}
        hotspot={image.hotspot}
        className="relative max-h-96"
        preview={image.metadata.lqip}
      />
    </div>
  );
};
