import forEach from "lodash/forEach.js";
import isNil from "lodash/isNil.js";
import merge from "lodash/merge.js";

import { HTTP_STATUS } from "../constants/http.ts";

type GetCorsHeadersProperties = {
  headers?: string;
  methods?: string;
  origin?: null | string | undefined;
};

const defaultHeaders: GetCorsHeadersProperties = {
  headers: "*",
  methods: "*",
  origin: "*",
};

const getDefaultHeaders = (headers = defaultHeaders) => {
  return {
    "Access-Control-Allow-Headers": headers.headers,
    "Access-Control-Allow-Methods": headers.methods,
    "Access-Control-Allow-Origin": headers.origin,
    "Cross-Origin-Embedder-Policy": 'require-corp; report-to="default";',
    "Cross-Origin-Opener-Policy": 'same-site; report-to="default";',
    "Cross-Origin-Resource-Policy": "same-site",
    "Public-Key-Pins": undefined,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-AspNet-Version": undefined,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Powered-By": undefined,
    "X-XSS-Protection": "0",
  };
};

export const createJsonResponse = <T>(
  data: T,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(
    { "Content-Type": "application/json" },
    getDefaultHeaders(),
    responseInit?.headers,
  );

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
