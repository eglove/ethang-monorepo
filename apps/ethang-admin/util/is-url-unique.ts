import type { UrlRule } from "sanity";

import first from "lodash/first.js";
import isNil from "lodash/isNil.js";
import replace from "lodash/replace.js";
import split from "lodash/split.js";

export const isUrlUnique = (
  rule: UrlRule,
  isRequired: boolean,
  documentType: string,
) => {
  return rule.custom(async (value, context) => {
    if (isNil(value) || "" === value) {
      return isRequired ? "URL is required." : true;
    }

    const { document, getClient } = context;

    if (document === undefined) {
      return true;
    }

    const date = first(split(new Date().toISOString(), "T")) ?? "";
    const client = getClient({ apiVersion: date });
    const id = replace(document._id, /^drafts\./u, "");

    const parameters = {
      id,
      type: documentType,
      url: value,
    };

    const query = `*[_type == $type && url == $url && _id != $id][0]`;

    const result = await client.fetch<{ _id: string }>(query, parameters);
    return isNil(result) ? true : "URL must be unique";
  });
};
