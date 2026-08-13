import isNumber from "lodash/isNumber.js";

export const IMAGE_MAX_WIDTH = 1200;

export type ResolvedImageDimensions = {
  height: number;
  width: number;
};

export type SanityImageDimensions = {
  aspectRatio?: number;
  height?: number;
  width?: number;
};

/*
 * Resolve the intrinsic display size for a Sanity image so Astro's <Image>
 * gets explicit width/height (required for remote images). When only one
 * dimension is known we derive the other from the asset's aspect ratio,
 * falling back to 16:9, and never exceed IMAGE_MAX_WIDTH.
 */
export const resolveImageDimensions = (
  dimensions?: SanityImageDimensions,
  maxWidth = IMAGE_MAX_WIDTH
) => {
  const aspectRatio = dimensions?.aspectRatio ?? 16 / 9;
  const intrinsicHeight = dimensions?.height;
  const intrinsicWidth = dimensions?.width;
  let width = maxWidth;
  let height = Math.round(maxWidth / aspectRatio);

  if (isNumber(intrinsicWidth)) {
    width = Math.min(intrinsicWidth, maxWidth);
  }

  height = isNumber(intrinsicHeight)
    ? intrinsicHeight
    : Math.round(width / aspectRatio);

  return { height, width };
};
