import { contactsSchema } from "@ethang/schemas/src/dashboard/contact-schema.ts";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";

import { getToken } from "../../utilities/token.ts";
import { queryKeys } from "./queries.ts";

export const getContacts = (userId = "") => {
  return queryOptions({
    enabled: !isEmpty(userId),
    queryFn: async () => {
      if (isEmpty(userId)) {
        throw new Error("No user found");
      }

      const request = new Request("/api/contact", {
        headers: {
          Authorization: getToken(),
        },
      });
      const data = await fetchJson(request, contactsSchema);

      if (isError(data)) {
        throw new Error("Failed to fetch contacts");
      }

      return data;
    },
    queryKey: queryKeys.contacts(userId),
  });
};
