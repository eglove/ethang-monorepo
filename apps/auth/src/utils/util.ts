import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http";
import merge from "lodash/merge.js";

export const createResponse = (
  data: unknown,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  const headers = merge({ "Content-Type": "application/json" }, responseInit?.headers);

  return new globalThis.Response(JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers,
  });
};
