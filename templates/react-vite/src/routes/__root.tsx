// eslint-disable-next-line react/naming-convention/filename
import { createRootRoute } from "@tanstack/react-router";

import { GlobalProviders } from "../components/global-providers.tsx";

export const Route = createRootRoute({
  component: () => <GlobalProviders />,
});
