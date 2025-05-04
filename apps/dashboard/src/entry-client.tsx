// @refresh reload
import { mount, StartClientTanstack } from "@solidjs/start/client";

mount(
  () => <StartClientTanstack />,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  globalThis.document.querySelector("#app")!,
);
