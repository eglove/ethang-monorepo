import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createContact } from "./create-contact.ts";
import { deleteContact } from "./delete-contact.ts";
import { getAllContacts } from "./get-all-contacts.ts";
import { updateContact } from "./update-contact.ts";

export const contactRouter = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  switch (request.method) {
    case "DELETE": {
      return deleteContact(request, environment, userId);
    }

    case "GET": {
      return getAllContacts(environment, userId);
    }

    case "POST": {
      return createContact(request, environment, userId);
    }

    case "PUT": {
      return updateContact(request, environment, userId);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
