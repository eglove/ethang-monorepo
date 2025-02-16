import isNil from "lodash/isNil.js";
import merge from "lodash/merge.js";

import { HTTP_STATUS } from "../constants/http.ts";

type GetCorsHeadersProperties = {
  headers?: string;
  methods?: string;
  origin?: null | string | undefined;
};

const getCorsHeaders = ({
  headers = "*",
  methods = "*",
  origin = "*",
}: GetCorsHeadersProperties) => {
  return {
    "Access-Control-Allow-Headers": headers,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Origin": origin,
  };
};

export const createJsonResponse = (
  data: unknown,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(
    { "Content-Type": "application/json" },
    responseInit?.headers,
    getCorsHeaders({}),
  );

  return new globalThis.Response(isNil(data) ? null : JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
