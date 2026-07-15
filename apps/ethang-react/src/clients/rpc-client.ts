import { Effect, Option, Schema } from "effect";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil";

const StoredUserSchema = Schema.Struct({
  sessionToken: Schema.optional(Schema.String)
});

export const rpcRequest = async <T>(
  service: string,
  method: string,
  parameters?: Record<string, unknown>
) => {
  const storedUser = localStorage.getItem("ethang-user");
  let token = "";

  if (!isNil(storedUser)) {
    attempt(() => {
      const decoded = Schema.decodeUnknownOption(StoredUserSchema)(
        JSON.parse(storedUser)
      );
      if (Option.isSome(decoded)) {
        token = decoded.value.sessionToken ?? "";
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
    Effect.runSync(
      Effect.die(new Error(`HTTP error! Status: ${response.status}`))
    );
  }

  const result: T = await response.json();
  return result;
};
