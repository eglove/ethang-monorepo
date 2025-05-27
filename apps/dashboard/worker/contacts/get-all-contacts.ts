import type { Contact } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";

export const getAllContacts = async (environment: Env, userId: string) => {
  const contacts = await attemptAsync(async () =>
    environment.DB.prepare(
      `select *
       from contacts
       where userId = ?
       order by case
                    when expectedNextContact < date('now') then 1
                    else 0
                    end,
                expectedNextContact,
                lastContact`,
    )
      .bind(userId)
      .all<Contact>(),
  );

  if (isError(contacts)) {
    return createJsonResponse(
      { error: "Unable to get contacts" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(contacts.results, "OK");
};
