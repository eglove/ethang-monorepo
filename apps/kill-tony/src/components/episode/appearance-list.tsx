import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map";

import { AppearanceLink } from "./appearance-link.tsx";

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
          return <AppearanceLink name={part.value} />;
        }

        return part.value;
      })}
    </div>
  );
};
