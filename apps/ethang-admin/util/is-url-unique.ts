import type { UrlRule } from "sanity";

import isNil from "lodash/isNil.js";
import replace from "lodash/replace.js";
import { DateTime } from "luxon";

export const isUrlUnique = (
  rule: UrlRule,
  isRequired: boolean,
  documentType: string
) => {
  return rule.custom(async (value, context) => {
    if (isNil(value) || "" === value) {
      return isRequired ? "URL is required." : true;
    }

    const { document, getClient } = context;

    if (document === undefined) {
      return true;
    }

    const dateString = DateTime.now().toISODate();
    const client = getClient({ apiVersion: dateString });
    const id = replace(document._id, /^drafts\./u, "");

    const parameters = {
      id,
      type: documentType,
      url: value
    };

    const query = `*[_type == $type && url == $url && _id != $id && !(_id in path('drafts.**'))][0]`;

    const result = await client.fetch<{ _id: string; name: string }>(
      query,
      parameters
    );
    return isNil(result) ? true : `URL already used by ${result.name}`;
  });
};
