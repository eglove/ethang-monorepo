import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import {
  type ContactSchema,
  contactSchema,
} from "@ethang/schemas/src/job-search/contact-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const addContact = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, contactSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  return addContactNoCheck(requestData, tokenData, environment);
};

export const addContactNoCheck = async (
  requestData: ContactSchema,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      `insert into contacts (id, userEmail, name, email, linkedin, lastContact, expectedNextContact) values (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        requestData.id,
        tokenData.email,
        requestData.name,
        requestData.email,
        requestData.linkedin,
        requestData.lastContact,
        requestData.expectedNextContact,
      )
      .first();
  });

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(requestData, "OK");
};
