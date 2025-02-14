import { Providers } from "@/components/common/providers.tsx";
import { createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Providers />,
});
