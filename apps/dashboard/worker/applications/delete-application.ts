import { deleteApplicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteApplication = async (request: Request, environment: Env) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "delete from applications where id = ? and userId = ?",
      )
        .bind(body.id, body.userId)
        .first();
    },
    request,
    requestSchema: deleteApplicationSchema,
  });
};
