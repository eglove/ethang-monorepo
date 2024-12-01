import type { PropsWithChildren } from "react";

import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";

type ProjectLinkProperties = PropsWithChildren<{
  url: string;
}>;

export const ProjectLink = ({
  children,
  url,
}: Readonly<ProjectLinkProperties>) => {
  return (
    <TypographyLink
      href={url}
    >
      {children}
    </TypographyLink>
  );
};
