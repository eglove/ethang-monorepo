import { Link, type LinkProps } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";

type InternalLinkProperties = {
  href: string;
  underline?: Parameters<typeof Link>[0]["underline"];
} & LinkProps;

export const InternalLink = ({
  children,
  href,
  underline
}: Readonly<InternalLinkProperties>) => {
  return (
    <Link asChild underline={underline ?? "always"}>
      <RouterLink to={href}>{children}</RouterLink>
    </Link>
  );
};
