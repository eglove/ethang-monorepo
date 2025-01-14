import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http";
import merge from "lodash/merge.js";

import { store } from "../index.ts";

export const createResponse = (
  data: unknown,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge(
    { "Content-Type": "application/json" },
    responseInit?.headers,
    store.corsHeaders,
  );

  return new globalThis.Response(JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
