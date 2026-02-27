import { toHTML } from "@portabletext/to-html";

import type { BlogModelType } from "../models/blog-model.ts";

type PortableTextProperties = {
  children: BlogModelType["body"];
};

export const PortableText = async ({ children }: PortableTextProperties) => {
  const html = toHTML(children);

  return <slot dangerouslySetInnerHTML={{ __html: html }} />;
};
