import { html } from "hono/html";

type ChevronLeftSvgProperties = {
  height?: number;
  width?: number;
};

export const chevronLeft = async (
  properties?: Readonly<ChevronLeftSvgProperties>,
) => {
  return html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${properties?.width ?? 24}"
      height="${properties?.height ?? 24}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-chevron-left-icon lucide-chevron-left"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  `;
};
