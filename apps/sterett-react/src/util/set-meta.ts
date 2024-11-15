import attempt from "lodash/attempt";
import isError from "lodash/isError";

type SetMetaProperties = {
  description: string;
  title: string;
};

export const setMeta = ({ description, title }: SetMetaProperties) => {
  document.title = title;
  const descriptionElement = document.createElement("meta");
  descriptionElement.name = "description";
  descriptionElement.content = description;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const head = attempt(document.querySelector.bind(document), "head");

  if (isError(head)) {
    return;
  }

  head?.append(descriptionElement);
};
