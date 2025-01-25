import forEach from "lodash/forEach.js";
import get from "lodash/get.js";
import padEnd from "lodash/padEnd.js";
import split from "lodash/split.js";

import { isNumber } from "../is/number.js";

type GetNumberMetaProperties = {
  locale?: string;
  maxFractionDigitsAfterZeros?: number;
  maxSubDigits?: number;
  minFractionDigitsAfterZeros?: number;
  options?: Intl.NumberFormatOptions;
  value: bigint | number | string;
};

export const getSubbedNumber = ({
  locale,
  maxFractionDigitsAfterZeros,
  maxSubDigits = 4,
  minFractionDigitsAfterZeros,
  options,
  value,
}: GetNumberMetaProperties) => {
  const preModifiedFormatter = Intl.NumberFormat(locale, {
    ...options,
  });
  const resolvedOptions = preModifiedFormatter.resolvedOptions();

  const formatter = Intl.NumberFormat(locale, {
    ...options,
    maximumFractionDigits: 100,
  });
  const parts = formatter.formatToParts(
    isNumber(value) ? value : Number(value),
  );

  let finalNumber = "";

  forEach(parts, (part) => {
    if ("fraction" === part.type && part.value) {
      const leadingZeroes = get(/^0+/u.exec(part.value), [0, "length"], 0);

      if (maxSubDigits < leadingZeroes && 1 > Number(value)) {
        const afterZeroes = part.value.slice(leadingZeroes);

        const afterZerosString = padEnd(
          afterZeroes,
          minFractionDigitsAfterZeros ?? resolvedOptions.minimumFractionDigits,
          "0",
        ).slice(
          0,
          // eslint-disable-next-line sonar/argument-type
          maxFractionDigitsAfterZeros ?? resolvedOptions.maximumFractionDigits,
        );
        finalNumber += `0:sub:${leadingZeroes - 1}:sub:${afterZerosString}`;
      } else {
        finalNumber += padEnd(
          part.value,
          resolvedOptions.minimumFractionDigits,
          "0",
        )
          // eslint-disable-next-line sonar/argument-type
          .slice(0, resolvedOptions.maximumFractionDigits);
      }
    } else {
      finalNumber += part.value;
    }
  });

  return split(finalNumber, ":sub:");
};
