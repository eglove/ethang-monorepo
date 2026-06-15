import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import keys from "lodash/keys.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { DateTime } from "luxon";

export const getCookieValue = <T extends string>(
  cookieName: T,
  cookieSource: Headers | string
): Error | string => {
  let cookies = isString(cookieSource) ? cookieSource : null;

  if (cookieSource instanceof Headers) {
    cookies = cookieSource.get("Cookie");
  }

  if (isNil(cookies)) {
    return new Error("cookies not found");
  }

  const cookieArray = split(cookies, ";");
  for (const cookie of cookieArray) {
    const equalsIndex = cookie.indexOf("=");
    if (-1 === equalsIndex) {
      if (trim(cookie) === trim(cookieName)) {
        return "";
      }
    } else {
      const name = cookie.slice(0, Math.max(0, equalsIndex));
      const value = cookie.slice(Math.max(0, equalsIndex + 1));

      if (trim(name) === trim(cookieName)) {
        return trim(value);
      }
    }
  }

  return new Error("failed to get cookie");
};

type SetCookieValueProperties<T extends string> = {
  config?: {
    Domain?: string;
    Expires?: DateTime;
    HttpOnly?: boolean;
    "Max-Age"?: number;
    Partitioned?: boolean;
    Path?: string;
    SameSite?: "Lax" | "None" | "Strict";
    Secure?: boolean;
  };
  cookieName: T;
  cookieValue: string;
  response: Response;
};

export const setCookieValue = <T extends string>({
  config,
  cookieName,
  cookieValue,
  response
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
      } else if (value instanceof DateTime) {
        cookieString += `; Expires=${value.toHTTP()}`;
      } else {
        // do nothing
      }
    }
  }

  response.headers.append("Set-Cookie", cookieString);
};

export const deleteCookieValue = <T extends string>(
  cookieName: T,
  response: Response,
  config?: Omit<SetCookieValueProperties<T>["config"], "Expires" | "Max-Age">
): void => {
  setCookieValue({
    config: {
      ...config,
      Expires: DateTime.fromMillis(0),
      "Max-Age": 0
    },
    cookieName,
    cookieValue: "",
    response
  });
};
