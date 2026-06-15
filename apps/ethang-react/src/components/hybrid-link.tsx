import { Link, type LinkProps } from "@radix-ui/themes";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";

import { InternalLink } from "./internal-link.tsx";

type HybridLinkProperties = {
  href: string;
  underline?: Parameters<typeof Link>[0]["underline"];
} & LinkProps;

export const HybridLink = (properties: Readonly<HybridLinkProperties>) => {
  const { origin } = new URL(globalThis.location.href);

  const url = attempt(() => {
    return new URL(properties.href);
  });

  if (isError(url) || (!isError(url) && url.origin === origin)) {
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
