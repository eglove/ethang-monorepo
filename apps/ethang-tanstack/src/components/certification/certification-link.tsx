import type { PropsWithChildren } from "react";

import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";

type CertificationLinkProperties = PropsWithChildren<{
  url: string;
}>;

export const CertificationLink = ({
  children,
  url,
}: Readonly<CertificationLinkProperties>) => {
  return (
    <TypographyLink href={url}>
      {children}
    </TypographyLink>
  );
};
