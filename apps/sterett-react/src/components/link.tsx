import { Link as NextUiLink } from "@nextui-org/link";
import { Link as TanStackLink } from "@tanstack/react-router";

type LinkProperties = Readonly<
  Parameters<typeof NextUiLink>[0] & Partial<Parameters<typeof TanStackLink>[0]>
>;

export const Link = (properties: LinkProperties) => {
  const { href } = properties;
  return (
    <NextUiLink
      as={TanStackLink}
      {...properties}
      href={undefined as unknown as string}
      to={href}
    />
  );
};
