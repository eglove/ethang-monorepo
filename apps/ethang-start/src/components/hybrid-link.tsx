import type { Link } from "@astryxdesign/core";

import { Link as TanStackLink } from "@tanstack/react-router";

/*
 * Do not use this component directly it is provided by ../providers.tsx
 * Instead use import { Link } from "@astryxdesign/core";
 */
export const HybridLink = (properties: Parameters<typeof Link>[0]) => {
  const canParse = URL.canParse(properties.href ?? "#");
  const url = properties.href ?? "#";

  const fallbackTarget = canParse ? "_blank" : "_self";

  return (
    <TanStackLink to={url} target={properties.target ?? fallbackTarget}>
      {properties.children}
    </TanStackLink>
  );
};
