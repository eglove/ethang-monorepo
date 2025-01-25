import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getCookieValue } from "../http/cookie.ts";
import { getAcceptLanguage } from "../http/headers.ts";

type LocaleSource = "accept-language" | "cookie" | "localStorage" | "navigator";

export const getLocale = (
  sourceTypes: readonly LocaleSource[],
  source?: Readonly<Headers | string>,
  valueName?: Readonly<string>,
) => {
  for (const sourceType of sourceTypes) {
    if ("accept-language" === sourceType && !isNil(source)) {
      return getFromAcceptLanguage(source);
    }

    if ("cookie" === sourceType && !isNil(valueName) && !isNil(source)) {
      return getFromCookie(valueName, source);
    }

    if ("navigator" === sourceType && "undefined" !== typeof navigator) {
      return navigator.language;
    }

    if (
      "localStorage" === sourceType &&
      "undefined" !== typeof localStorage &&
      !isNil(valueName)
    ) {
      return getFromLocalStorage(valueName);
    }
  }

  return null;
};

const getFromAcceptLanguage = (source: Readonly<Headers | string>) => {
  const value = getAcceptLanguage(source);

  if (isError(value)) {
    return null;
  }

  let language = get(value, [0, "language"]);
  const country = get(value, [0, "country"]);
  if (!isNil(language)) {
    if (!isNil(country)) {
      language += `-${country}`;
    }

    return language;
  }

  return null;
};

const getFromCookie = (
  valueName: string,
  source: Readonly<Headers | string>,
) => {
  const value = getCookieValue(valueName, source);

  if (!isError(value)) {
    return value;
  }

  return null;
};

const getFromLocalStorage = (valueName: string) => {
  const value = attempt(localStorage.getItem.bind(localStorage), valueName);

  if (!isNil(value) && !isError(value)) {
    return value;
  }

  return null;
};
