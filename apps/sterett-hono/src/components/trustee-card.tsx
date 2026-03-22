import type { TrusteeRecord } from "../sanity/get-trustees.ts";

import { sanityImage } from "../clients/sanity-client.ts";

type TrusteeCardProperties = {
  trustee: TrusteeRecord;
};

const IMAGE_SIZE = 128;

export const TrusteeCard = async ({ trustee }: TrusteeCardProperties) => {
  const imageUrl = sanityImage
    .image(trustee.image.asset.url)
    .height(IMAGE_SIZE)
    .width(IMAGE_SIZE)
    .format("webp")
    .url();

  return (
    <div class="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-6 text-center">
      <img
        src={imageUrl}
        alt={trustee.name}
        width={IMAGE_SIZE}
        height={IMAGE_SIZE}
        class="rounded-full object-cover"
      />
      <div class="flex flex-col gap-1">
        <p class="font-semibold">{trustee.name}</p>
        <a
          href={`tel:${trustee.phoneNumber}`}
          class="text-sm text-white/70 underline-offset-2 hover:underline"
        >
          {trustee.phoneNumber}
        </a>
        <p class="text-sm text-white/50">{trustee.duties}</p>
      </div>
    </div>
  );
};
