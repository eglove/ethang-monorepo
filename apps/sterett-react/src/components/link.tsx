import { Link as NextUiLink } from "@heroui/link";
import { Link as TanStackLink } from "@tanstack/react-router";

type LinkProperties = Readonly<
  Parameters<typeof NextUiLink>[0] & Partial<Parameters<typeof TanStackLink>[0]>
>;

export const Link = (properties: LinkProperties) => {
  const { href } = properties;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const fakeHref = undefined as unknown as string;

  return (
    <NextUiLink
      as={TanStackLink}
      {...properties}
      href={fakeHref}
      to={href}
    />
  );
};
