import attempt from "lodash/attempt";
import isError from "lodash/isError";

type SetMetaProperties = {
  description: string;
  title: string;
};

export const setMeta = ({ description, title }: SetMetaProperties) => {
  globalThis.document.title = title;
  const descriptionElement = globalThis.document.createElement("meta");
  descriptionElement.name = "description";
  descriptionElement.content = description;
  const head = attempt(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    globalThis.document.querySelector.bind(globalThis.document),
    "head",
  );

  if (isError(head)) {
    return;
  }

  head?.append(descriptionElement);
};
