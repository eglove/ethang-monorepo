import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";

import { contactSchema } from "@ethang/schemas/src/job-search/contact-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { addContactNoCheck } from "./add-contact.js";

export const updateContact = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, contactSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      `update contacts set name = ?, email = ?, linkedin = ?, lastContact = ?, expectedNextContact = ? where id = ? and userEmail = ?`,
    )
      .bind(
        requestData.name,
        requestData.email,
        requestData.linkedin,
        requestData.lastContact,
        requestData.expectedNextContact,
        requestData.id,
        tokenData.email,
      )
      .first();
  });

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  if (isNil(result)) {
    return addContactNoCheck(requestData, tokenData, environment);
  }

  return createJsonResponse(requestData, "OK");
};
