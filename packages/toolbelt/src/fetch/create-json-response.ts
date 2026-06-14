import forEach from "lodash/forEach.js";
import isArray from "lodash/isArray.js";
import isBoolean from "lodash/isBoolean.js";
import isNil from "lodash/isNil.js";
import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";
import join from "lodash/join.js";
import replace from "lodash/replace.js";
import toLower from "lodash/toLower.js";
import { v7 } from "uuid";

import { HTTP_STATUS } from "../constants/http.ts";

const getDefaultHeaders = () => {
  const nonce = replace(v7(), "-", "");
  const csp = join(
    [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https: http:`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https:`,
      `font-src 'self' data: https:`,
      `connect-src 'self'`,
      `object-src 'none'`,
      `base-uri 'none'`,
      `frame-ancestors 'self'`,
      `form-action 'self'`,
      `require-trusted-types-for 'script'`
    ],
    "; "
  );

  return {
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Origin": "*",
    "Content-Security-Policy": csp,
    "Content-Type": "application/json",
    "Cross-Origin-Embedder-Policy": 'require-corp; report-to="default";',
    "Cross-Origin-Opener-Policy": 'same-site; report-to="default";',
    "Cross-Origin-Resource-Policy": "same-site",
    "Public-Key-Pins": undefined,
    "Referrer-Policy": "same-origin",
    "X-AspNet-Version": undefined,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Powered-By": undefined,
    "X-XSS-Protection": "1; mode=block"
  };
};

const getHeaderEntries = (input: HeadersInit): [string, unknown][] => {
  const entries: [string, unknown][] = [];

  if (input instanceof Headers) {
    for (const [key, value] of input.entries()) {
      entries.push([key, value]);
    }
  } else if (isArray(input)) {
    for (const entry of input) {
      if (isArray(entry)) {
        const [key, value] = entry as [string, unknown];
        entries.push([key, value]);
      }
    }
  } else {
    forEach(input, (value, key) => {
      entries.push([key, value]);
    });
  }

  return entries;
};

export const createJsonResponse = <T>(
  data: T,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit
) => {
  const headers = new Headers();

  const defaults = getDefaultHeaders();
  forEach(defaults, (value, key) => {
    if (!isNil(value)) {
      headers.set(key, value);
    }
  });

  if (!isNil(responseInit) && !isNil(responseInit.headers)) {
    const criticalHeaders = new Set([
      "access-control-allow-origin",
      "content-security-policy",
      "x-frame-options"
    ]);

    const entries = getHeaderEntries(responseInit.headers);
    for (const [key, value] of entries) {
      const lowerKey = toLower(key);
      if (isNil(value) && !criticalHeaders.has(lowerKey)) {
        headers.delete(key);
      } else if (isString(value) || isNumber(value) || isBoolean(value)) {
        headers.set(key, String(value));
      } else {
        // Do nothing
      }
    }
  }

  return new Response(isNil(data) ? null : JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers
  });
};
