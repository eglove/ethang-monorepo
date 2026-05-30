import { Link } from "@radix-ui/themes";
import isNil from "lodash/isNil.js";

import { InternalLink } from "./internal-link.tsx";

type HybridLinkProperties = {
  children: string;
  href: string;
  underline?: Parameters<typeof Link>[0]["underline"];
};

export const HybridLink = (properties: Readonly<HybridLinkProperties>) => {
  const { origin } = new URL(globalThis.location.href);
  const parsed = URL.parse(properties.href);

  if (isNil(parsed) || origin === new URL(properties.href).origin) {
    // eslint-disable-next-line react/no-implicit-children,react/x-no-implicit-children
    return <InternalLink {...properties} />;
  }

  return (
    <Link
      // eslint-disable-next-line react/no-implicit-children,react/x-no-implicit-children
      {...properties}
      target="_blank"
      underline={properties.underline ?? "auto"}
    />
  );
};
