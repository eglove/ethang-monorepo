import type { PropsWithChildren } from "hono/jsx";

type NavigationLinkProperties = PropsWithChildren<{
  href: string;
  pathname: string;
}>;

export const NavigationLink = async (properties: NavigationLinkProperties) => {
  const isCurrentPage = properties.pathname === properties.href;
  const className = isCurrentPage
    ? "block py-2 px-3 rounded border border-sky-300/30 bg-sky-300/10 text-sky-300 md:px-3 md:py-1"
    : "block py-2 px-3 rounded border border-transparent text-slate-200 hover:bg-slate-700 hover:text-slate-100 md:px-3 md:py-1 md:hover:bg-transparent md:hover:text-slate-100";

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
