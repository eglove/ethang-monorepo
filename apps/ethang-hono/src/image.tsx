import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import { twMerge } from "tailwind-merge";

type ImageProperties = {
  alt: string;
  caption?: string;
  className?: string;
  containerWidth?: number | string;
  height: number | string;
  imgClassName?: string;
  lazy?: boolean;
  priority?: boolean;
  sizes?: string;
  src: string;
  srcset?: string;
  width: number | string;
};

export const Image = async (properties: ImageProperties) => {
  const {
    alt,
    caption,
    className = "",
    containerWidth,
    height,
    imgClassName,
    lazy = true,
    priority = false,
    sizes,
    src,
    srcset,
    width,
  } = properties;

  let loadingStrategy: "eager" | "lazy" = "eager";
  let displayWidth = "auto";
  const fetchPriority = priority ? "high" : "auto";

  if (!priority && lazy) {
    loadingStrategy = "lazy";
  }

  if (isNumber(containerWidth)) {
    displayWidth = `${containerWidth}px`;
  }

  if (isString(containerWidth)) {
    displayWidth = containerWidth;
  }

  return (
    <figure
      style={{ width: displayWidth }}
      class={twMerge(
        "relative my-4 mx-0 overflow-hidden flex flex-col",
        className,
      )}
    >
      <img
        alt={alt}
        src={src}
        sizes={sizes}
        width={width}
        height={height}
        srcset={srcset}
        loading={loadingStrategy}
        fetchpriority={fetchPriority}
        class={twMerge(
          "block w-full h-auto object-cover rounded-[inherit]",
          imgClassName,
        )}
      />
      {!isNil(caption) && (
        <figcaption class="mt-2 text-center text-sm text-body-subtle">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
