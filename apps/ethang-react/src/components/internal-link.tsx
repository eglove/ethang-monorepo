import { Link } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";

type InternalLinkProperties = {
  children: string;
  href: string;
  underline?: Parameters<typeof Link>[0]["underline"];
};

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
