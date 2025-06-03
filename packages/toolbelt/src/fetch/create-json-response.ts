import forEach from "lodash/forEach.js";
import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import merge from "lodash/merge.js";
import replace from "lodash/replace.js";
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
      `require-trusted-types-for 'script'`,
    ],
    "; ",
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
    "X-XSS-Protection": "1; mode=block",
  };
};

export const createJsonResponse = <T>(
  data: T,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(getDefaultHeaders(), responseInit?.headers);

  forEach(headers, (value, key) => {
    if (isNil(value)) {
      // @ts-expect-error ignore
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete headers[key];
    }
  });

  return new globalThis.Response(isNil(data) ? null : JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
