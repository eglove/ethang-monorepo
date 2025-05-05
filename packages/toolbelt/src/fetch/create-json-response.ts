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

const getCorsHeaders = (headers = defaultHeaders) => {
  return {
    "Access-Control-Allow-Headers": headers.headers,
    "Access-Control-Allow-Methods": headers.methods,
    "Access-Control-Allow-Origin": headers.origin,
  };
};

export const createJsonResponse = <T>(
  data: T,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(
    { "Content-Type": "application/json" },
    responseInit?.headers,
    getCorsHeaders(),
  );

  return new globalThis.Response(isNil(data) ? null : JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
