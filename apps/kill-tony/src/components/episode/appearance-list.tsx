import { Link } from "@heroui/react";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

type AppearanceListProperties = {
  appearances: { name: string }[];
  label: string;
};

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

const getAppearanceNames = (appearances: { name: string }[]) => {
  return map(appearances, "name").sort((a, b) => {
    return a.localeCompare(b);
  });
};

export const AppearanceList = ({
  appearances,
  label,
}: Readonly<AppearanceListProperties>) => {
  const appearanceNames = getAppearanceNames(appearances);

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
