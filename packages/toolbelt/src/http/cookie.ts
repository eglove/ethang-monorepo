import isDate from "lodash/isDate.js";
import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import keys from "lodash/keys.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

export const getCookieValue = <T extends string,>(
  cookieName: T,
  cookieSource: Headers | string,
): Error | string => {
  const cookies = isString(cookieSource)
    ? cookieSource
    : cookieSource.get("Cookie");

  if (isNil(cookies)) {
    return new Error("cookies not found");
  }

  const cookieArray = split(cookies,
    ";");
  for (const cookie of cookieArray) {
    const [
      name,
      value,
    ] = split(cookie,
      "=");

    if (trim(name) === trim(cookieName)) {
      return trim(value);
    }
  }

  return new Error("failed to get cookie");
};

type SetCookieValueProperties<T extends string,> = {
  config?: {
    Domain?: string;
    Expires?: Date;
    HttpOnly?: boolean;
    "Max-Age"?: number;
    Partitioned?: boolean;
    Path?: string;
    SameSite?: "Lax" | "None" | "Secure" | "Strict";
    Secure?: boolean;
  };
  cookieName: T;
  cookieValue: string;
  response: Response;
};

export const setCookieValue = <T extends string,>({
  config,
  cookieName,
  cookieValue,
  response,
}: SetCookieValueProperties<T>) => {
  let cookieString = `${cookieName}=${cookieValue}`;

  if (!isNil(config)) {
    for (const key of keys(config)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const value = config[key as keyof typeof config];

      if (isString(value) || isNumber(value)) {
        cookieString += `; ${key}=${String(value)}`;
      } else if (true === value) {
        cookieString += `; ${key}`;
      } else if (isDate(value)) {
        cookieString += `; Expires=${value.toUTCString()}`;
      } else {
        // do nothing
      }
    }
  }

  response.headers.append("Set-Cookie", cookieString);
};
