import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil";
import isObject from "lodash/isObject";
import isString from "lodash/isString";

export const rpcRequest = async <TResult>(
  service: string,
  method: string,
  parameters?: Record<string, unknown>
): Promise<TResult> => {
  const storedUser = localStorage.getItem("ethang-user");
  let token = "";

  if (!isNil(storedUser)) {
    attempt(() => {
      const parsed: unknown = JSON.parse(storedUser);
      if (isObject(parsed) && !isNil(parsed) && "sessionToken" in parsed) {
        const { sessionToken } = parsed as Record<string, unknown>;
        if (isString(sessionToken)) {
          token = sessionToken;
        }
      }
    });
  }

  const response = await fetch("/api/rpc", {
    body: JSON.stringify({ method, params: parameters ?? {}, service }),
    headers: {
      "Content-Type": "application/json",
      ...(token && { "X-Token": token })
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
};
