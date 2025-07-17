import type z from "zod";

import { Link } from "@heroui/react";
import filter from "lodash/filter";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

import type { baseAppearancesSchema } from "../../../schemas/schemas.ts";

type AppearanceListProperties = {
  appearances: z.output<typeof baseAppearancesSchema>;
  label: string;
  type: "isBucketPull" | "isGuest" | "isRegular";
};

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

const getAppearanceByType = (
  type: "isBucketPull" | "isGuest" | "isRegular",
  appearances: z.output<typeof baseAppearancesSchema>,
) => {
  return map(
    filter(appearances, (appearance) => {
      return appearance[type];
    }),
    (appearance) => {
      return appearance.name;
    },
  ).sort((a, b) => {
    return a.localeCompare(b);
  });
};

export const AppearanceList = ({
  appearances,
  label,
  type,
}: Readonly<AppearanceListProperties>) => {
  const appearanceNames = getAppearanceByType(type, appearances);

  if (isEmpty(appearanceNames)) {
    return null;
  }

  return (
    <div>
      <span>{label}:</span>{" "}
      {map(formatter.formatToParts(appearanceNames), (part) => {
        if ("element" === part.type) {
          const appearanceUrl = URL.parse(
            `/appearance/${part.value}`,
            globalThis.location.origin,
          );

          return (
            <Link
              href={isNil(appearanceUrl) ? "" : appearanceUrl.pathname}
              key={part.value}
              underline="always"
            >
              {part.value}
            </Link>
          );
        }

        return part.value;
      })}
    </div>
  );
};
