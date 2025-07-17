import { useQuery } from "@apollo/client";
import { Link } from "@heroui/react";
import isNil from "lodash/isNil";

import { getAppearance, type GetAppearance } from "../../graphql/queries.ts";

type AppearanceLinkProperties = {
  name: string;
};

export const AppearanceLink = ({
  name,
}: Readonly<AppearanceLinkProperties>) => {
  useQuery<GetAppearance>(getAppearance, {
    variables: { name },
  });

  const appearanceUrl = URL.parse(
    `/appearance/${name}`,
    globalThis.location.origin,
  );

  return (
    <Link
      href={isNil(appearanceUrl) ? "" : appearanceUrl.pathname}
      key={name}
      underline="always"
    >
      {name}
    </Link>
  );
};
