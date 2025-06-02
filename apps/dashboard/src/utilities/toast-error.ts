import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { addToast } from "@heroui/react";
import isError from "lodash/isError";
import z from "zod";

export const toastError = (value: unknown) => {
  if (value instanceof Response) {
    parseFetchJson(value, z.object({ error: z.string() }))
      .then((result) => {
        addToast({
          color: "danger",
          description: isError(result) ? "Unknown Error" : result.error,
          title: "Error",
        });
      })
      .catch(globalThis.console.error);

    return;
  }

  addToast({
    color: "danger",
    description: isError(value) ? value.message : "Unknown Error",
    title: "Error",
  });
};
