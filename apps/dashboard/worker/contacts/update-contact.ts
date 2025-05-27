import { contactSchema } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateContact = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "update contacts set name = ?, phone = ?, email = ?, linkedIn = ?, lastContact = ?, expectedNextContact = ? where id = ? and userId = ?",
      )
        .bind(
          body.name,
          body.phone,
          body.email,
          body.linkedIn,
          body.lastContact,
          body.expectedNextContact,
          body.id,
          userId,
        )
        .first();
    },
    request,
    requestSchema: contactSchema,
  });
};
