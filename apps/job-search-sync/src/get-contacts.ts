import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const getContacts = async (tokenData: TokenSchema, environment: Env) => {
  const contacts = await attemptAsync(async () => {
    return environment.DB.prepare(
      `select *
             from contacts
             where userEmail = ?`,
    )
      .bind(tokenData.email)
      .all();
  });

  if (isError(contacts)) {
    return createJsonResponse(
      { error: contacts.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(contacts.results, "OK");
};
