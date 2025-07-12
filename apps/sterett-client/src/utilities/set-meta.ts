type SetMetaProperties = {
  description: string;
  title: string;
};

export const setMeta = ({ description, title }: SetMetaProperties) => {
  globalThis.document.title = title;
  const descriptionElement = globalThis.document.createElement("meta");
  descriptionElement.name = "description";
  descriptionElement.content = description;
  const { head } = globalThis.document;

  // @ts-expect-error allow meta element
  head.append(descriptionElement);
};
