import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";

import { Providers } from "../components/providers.tsx";
import { createHead } from "../util/create-head.ts";

export const Route = createRootRoute({
  component: () => (
    <Providers>
      <HeadContent />
      <Outlet />
    </Providers>
  ),
  head: createHead({
    description:
      "EthanG's personal portfolio and contact site. Discover projects and get in touch.",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "EthanG",
  }),
});
