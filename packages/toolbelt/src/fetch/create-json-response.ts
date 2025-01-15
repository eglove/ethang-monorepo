import merge from "lodash/merge.js";

import { HTTP_STATUS } from "../constants/http.ts";

export const createJsonResponse = (
  data: unknown,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(
    { "Content-Type": "application/json" },
    responseInit?.headers,
  );

  return globalThis.Response.json(JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
