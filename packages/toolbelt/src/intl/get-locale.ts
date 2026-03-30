import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getCookieValue } from "../http/cookie.ts";
import { getAcceptLanguage } from "../http/headers.ts";

type LocaleHandler = (
  source?: Readonly<Headers | string>,
  valueName?: Readonly<string>,
) => null | string | undefined;

type LocaleSource = "accept-language" | "cookie" | "localStorage" | "navigator";

const acceptLanguageHandler: LocaleHandler = (source) => {
  return isNil(source) ? undefined : getFromAcceptLanguage(source);
};

const cookieHandler: LocaleHandler = (source, valueName) => {
  return isNil(source) || isNil(valueName)
    ? undefined
    : getFromCookie(valueName, source);
};

const navigatorHandler: LocaleHandler = () => {
  return "undefined" === typeof navigator ? undefined : navigator.language;
};

const localStorageHandler: LocaleHandler = (_, valueName) => {
  return isNil(valueName) || "undefined" === typeof localStorage
    ? undefined
    : getFromLocalStorage(valueName);
};

const SOURCE_HANDLERS: Record<LocaleSource, LocaleHandler> = {
  "accept-language": acceptLanguageHandler,
  cookie: cookieHandler,
  localStorage: localStorageHandler,
  navigator: navigatorHandler,
};

export const getLocale = (
  sourceTypes: readonly LocaleSource[],
  source?: Readonly<Headers | string>,
  valueName?: Readonly<string>,
) => {
  for (const sourceType of sourceTypes) {
    const result = SOURCE_HANDLERS[sourceType](source, valueName);

    if (undefined !== result) {
      return result;
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
