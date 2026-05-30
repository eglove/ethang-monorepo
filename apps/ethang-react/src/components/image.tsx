import type { DetailedHTMLProps, ImgHTMLAttributes } from "react";

import { twMerge } from "tailwind-merge";

type ImageProperties = {
  alt: string;
  container?: { className?: string };
} & Readonly<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
>;

export const Image = (properties: ImageProperties) => {
  return (
    <div
      className={twMerge(
        "relative mx-0 my-4 flex flex-col overflow-hidden",
        properties.container?.className
      )}
    >
      <img
        loading="lazy"
        {...properties}
        alt={properties.alt}
        className={twMerge(
          "block w-full h-auto object-cover rounded-[inherit]",
          properties.className
        )}
      />
    </div>
  );
};
