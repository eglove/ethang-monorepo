import compact from "lodash/compact.js";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

import { isBigIntOrNumber } from "../is/big-int-or-number.ts";

type AcceptLanguageResults = {
  country: null | string;
  language: null | string;
  name: string;
  quality: number;
}[];

export const getAcceptLanguage = (
  acceptLanguage: Readonly<Headers | string>
): AcceptLanguageResults | Error => {
  const languages = split(
    isString(acceptLanguage)
      ? acceptLanguage
      : acceptLanguage.get("accept-language"),
    ","
  );

  if (isEmpty(compact(languages))) {
    return new Error("accept-language not found");
  }

  const result = map(languages, (lang) => {
    const [name, query] = split(lang, ";");
    const parts = split(name, "-");
    const language = get(parts, 0) || null;
    const country = get(parts, 1) || null;
    let quality = 1;
    if (!isNil(query)) {
      const [, value] = split(query, "=");
      if (isBigIntOrNumber(value)) {
        quality = Number(value);
      }
    }

    return {
      country,
      language,
      name: trim(name),
      quality
    } as const;
  });

  return orderBy(result, ["quality"], ["desc"]);
};
