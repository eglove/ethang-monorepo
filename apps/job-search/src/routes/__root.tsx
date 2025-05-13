// eslint-disable-next-line react/naming-convention/filename
import { createRootRoute } from "@tanstack/react-router";

import { Providers } from "@/components/common/providers.tsx";

export const Route = createRootRoute({
  component: () => <Providers />,
});
