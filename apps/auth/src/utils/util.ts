import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http";

export const createResponse = (
  data: unknown,
  status: keyof typeof HTTP_STATUS,
  responseInit?: ResponseInit,
) => {
  return new globalThis.Response(JSON.stringify(data), {
    status: HTTP_STATUS[status],
    ...responseInit,
    headers: {
      "Content-Type": "application/json",
      ...responseInit?.headers,
    },
  });
};
