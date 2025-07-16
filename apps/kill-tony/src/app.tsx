import { Button } from "@heroui/react";

import { Providers } from "./components/providers.tsx";

export const App = () => (
  <Providers>
    <p className="text-red-500">Hey</p>
    <Button color="primary">Hello</Button>
  </Providers>
);
