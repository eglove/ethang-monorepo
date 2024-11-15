import compact from "lodash/compact.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

import { isBigIntOrNumber } from "../is/big-int-or-number.ts";

type AcceptLanguageResults = {
  country: string | undefined;
  language: string | undefined;
  name: string;
  quality: number;
}[];

export const getAcceptLanguage = (
  acceptLanguage: Readonly<Headers | string>,
): AcceptLanguageResults | Error => {
  const languages = isString(acceptLanguage)
    ? split(acceptLanguage,
      ",")
    : split(acceptLanguage.get("accept-language"),
      ",");

  if (isEmpty(compact(languages))) {
    return new Error("accept-language not found");
  }

  const result = map(languages,
    (lang) => {
      const [
        name,
        query,
      ] = split(lang,
        ";");
      const [
        language,
        country,
      ] = split(name,
        "-") as [
      string | undefined,
      string | undefined
      ];
      let quality = 1;
      if (!isNil(query)) {
        const [, value] = split(query,
          "=");
        if (isBigIntOrNumber(value)) {
          quality = Number(value);
        }
      }

      return {
        country,
        language,
        name: trim(name),
        quality,
      } as const;
    });

  return orderBy(result,
    ["quality"],
    ["desc"]);
};
