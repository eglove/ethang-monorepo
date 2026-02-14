import { html } from "hono/html";

type ImageProperties = {
  alt: string;
  containerStyles?: string;
  height: number;
  originalHeight: number;
  originalWidth: number;
  src: string;
  width: number;
};

export const image = async (properties: Readonly<ImageProperties>) => {
  return html`
    <div
      style="width: ${properties.width}px; height: ${properties.height}px; overflow: hidden; ${properties.containerStyles ??
      ""}"
    >
      <img
        width="${properties.originalWidth}px"
        height="${properties.originalHeight}px"
        loading="lazy"
        decoding="async"
        src="${properties.src}"
        alt="${properties.alt}"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </div>
  `;
};
