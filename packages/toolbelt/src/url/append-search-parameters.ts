import isNil from "lodash/isNil.js";

export const appendSearchParameters = (
  url: URL,
  parameters: URLSearchParams,
): void => {
  if (!isNil(parameters)) {
    for (const [key, value] of parameters.entries()) {
      url.searchParams.append(key, value);
    }
  }
};
