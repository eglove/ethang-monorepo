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
        baseUrl={imageUrl}
        className="relative max-h-96"
        crop={image.crop}
        hotspot={image.hotspot}
        id={image._id}
        mode="contain"
        preview={image.metadata.lqip}
      />
    </div>
  );
};
