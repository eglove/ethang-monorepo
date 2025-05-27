import { deleteContactSchema } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteContact = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "delete from contacts where id = ? and userId = ?",
      )
        .bind(body.id, userId)
        .first();
    },
    request,
    requestSchema: deleteContactSchema,
  });
};
