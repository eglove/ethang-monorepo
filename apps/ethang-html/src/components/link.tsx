import { html } from "hono/html";

type ExternalLinkProperties<T extends ReturnType<typeof html> | string> = {
  className?: string;
  href: string;
  isExternal?: boolean;
  label: T extends string ? undefined : string;
  role?: string;
  title: T;
};

export const link = async <T extends ReturnType<typeof html> | string>(
  properties: ExternalLinkProperties<T>,
) => {
  return html`<a
    role="${properties.role ?? "link"}"
    class="${properties.className ?? ""}"
    href="${properties.href}"
    target="${true === properties.isExternal ? "_blank" : "_self"}"
    aria-label="${properties.label}"
    rel="${true === properties.isExternal ? "noopener noreferrer" : ""}"
  >
    ${properties.title}
  </a>`;
};
