import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { getCookieValue } from "../http/cookie.ts";
import { getAcceptLanguage } from "../http/headers.ts";

type LocaleHandler = (
  source?: null | Readonly<Headers> | string,
  valueName?: null | string
) => null | string;

type LocaleSource = "accept-language" | "cookie" | "localStorage" | "navigator";

const acceptLanguageHandler: LocaleHandler = (source) => {
  return isNil(source) ? null : getFromAcceptLanguage(source);
};

const cookieHandler: LocaleHandler = (source, valueName) => {
  return isNil(source) || isNil(valueName)
    ? null
    : getFromCookie(valueName, source);
};

const navigatorHandler: LocaleHandler = () => {
  return isNil(navigator) ? null : navigator.language;
};

const localStorageHandler: LocaleHandler = (_, valueName) => {
  return isNil(valueName) || "undefined" === typeof localStorage
    ? null
    : getFromLocalStorage(valueName);
};

const SOURCE_HANDLERS: Record<LocaleSource, LocaleHandler> = {
  "accept-language": acceptLanguageHandler,
  cookie: cookieHandler,
  localStorage: localStorageHandler,
  navigator: navigatorHandler
};

export const getLocale = (
  sourceTypes: readonly LocaleSource[],
  source?: null | Readonly<Headers> | string,
  valueName?: null | string
): null | string => {
  for (const sourceType of sourceTypes) {
    const result = SOURCE_HANDLERS[sourceType](source, valueName);

    if (!isNil(result)) {
      return result;
    }
  }

  return null;
};

export const getFromAcceptLanguage = (source: Readonly<Headers> | string) => {
  const value = getAcceptLanguage(source);

  if (isError(value)) {
    return null;
  }

  const { country, language } = get(value, [0]);

  if (!isEmpty(language)) {
    if (!isEmpty(country)) {
      return `${language}-${country}`;
    }

    return language;
  }

  return null;
};

const getFromCookie = (
  valueName: string,
  source: Readonly<Headers> | string
) => {
  const value = getCookieValue(valueName, source);

  if (!isError(value)) {
    return value;
  }

  return null;
};

const getFromLocalStorage = (valueName: string): null | string => {
  const value = attempt((name: string): null | string => {
    return localStorage.getItem(name);
  }, valueName);

  if (!isNil(value) && !isError(value)) {
    return value;
  }

  return null;
};
