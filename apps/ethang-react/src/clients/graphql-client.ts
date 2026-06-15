import { type DocumentNode, print } from "graphql";
import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil";
import isObject from "lodash/isObject";
import isString from "lodash/isString";

export type TypedDocumentNode<
  Result = Record<string, unknown>,
  Variables = Record<string, unknown>
> = {
  __apiType?: (variables: Variables) => Result;
} & DocumentNode;

export const graphqlRequest = async <TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables
) => {
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

  const response = await fetch("/api/graphql", {
    body: JSON.stringify({
      query: print(document),
      variables
    }),
    headers: {
      "Content-Type": "application/json",
      ...(token && { "X-Token": token })
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const json: { data: TResult } | { errors: { message: string }[] } =
    await response.json();

  const errors: unknown = get(json, ["errors"]);
  if (isArray(errors) && 0 < errors.length) {
    const message: unknown = get(errors, [0, "message"]);
    throw new Error(isString(message) ? message : "GraphQL error");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: TResult = get(json, ["data"]);
  return data;
};
