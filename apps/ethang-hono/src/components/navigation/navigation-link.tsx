import type { PropsWithChildren } from "hono/jsx";

type NavigationLinkProperties = PropsWithChildren<{
  href: string;
  pathname: string;
}>;

export const NavigationLink = async (properties: NavigationLinkProperties) => {
  const isCurrentPage = properties.pathname === properties.href;
  const className = isCurrentPage
    ? "block py-2 px-3 rounded bg-sky-300/10 border border-sky-300/30 text-sky-300 md:p-0 md:bg-sky-300/10 md:border-sky-300/30 md:text-sky-300"
    : "block py-2 px-3 rounded text-slate-200 hover:bg-slate-700 hover:text-slate-100 md:hover:bg-transparent md:border-0 md:hover:text-slate-100 md:p-0";

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
