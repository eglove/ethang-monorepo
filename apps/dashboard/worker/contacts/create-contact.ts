import {
  type Contact,
  createContactSchema,
} from "@ethang/schemas/src/dashboard/contact-schema.ts";
import { v7 } from "uuid";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const createContact = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "insert into contacts (id, userId, name, phone, email, linkedIn, lastContact, expectedNextContact) values (?, ?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          v7(),
          userId,
          body.name,
          body.phone,
          body.email,
          body.linkedIn,
          body.lastContact,
          body.expectedNextContact,
        )
        .first<Contact>();
    },
    request,
    requestSchema: createContactSchema,
  });
};
