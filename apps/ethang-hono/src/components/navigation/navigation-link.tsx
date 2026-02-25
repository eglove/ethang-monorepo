import type { PropsWithChildren } from "hono/jsx";

type NavigationLinkProperties = PropsWithChildren<{
  href: string;
  pathname: string;
}>;

export const NavigationLink = async (properties: NavigationLinkProperties) => {
  const isCurrentPage = properties.pathname === properties.href;
  const className = isCurrentPage
    ? "block py-2 px-3 text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0"
    : "block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent";

  return (
    <a
      class={className}
      href={properties.href}
      aria-current={isCurrentPage ? "page" : undefined}
    >
      {properties.children}
    </a>
  );
};
