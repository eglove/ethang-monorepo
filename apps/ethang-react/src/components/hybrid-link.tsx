import { Link, type LinkProps } from "@radix-ui/themes";
import isNil from "lodash/isNil.js";

import { InternalLink } from "./internal-link.tsx";

type HybridLinkProperties = {
  href: string;
  underline?: Parameters<typeof Link>[0]["underline"];
} & LinkProps;

export const HybridLink = (properties: Readonly<HybridLinkProperties>) => {
  const { origin } = new URL(globalThis.location.href);
  const parsed = URL.parse(properties.href);

  if (isNil(parsed) || origin === new URL(properties.href).origin) {
    return <InternalLink {...properties} />;
  }

  return (
    <Link
      {...properties}
      target="_blank"
      underline={properties.underline ?? "auto"}
    />
  );
};
