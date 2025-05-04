// @refresh reload
import {
  createHandler,
  type FetchEvent,
  StartServer,
} from "@solidjs/start/server";
import { createMemoryHistory } from "@tanstack/solid-router";
import replace from "lodash/replace.js";

import { router } from "./router";

const routerLoad = async (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const path = replace(url.href, url.origin, "");

  router.update({
    history: createMemoryHistory({
      initialEntries: [path],
    }),
  });

  await router.load();
};

export default createHandler(
  () => (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta
              content="width=device-width, initial-scale=1"
              name="viewport"
            />
            <link href="/favicon.ico" rel="icon" />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  ),
  undefined,
  routerLoad,
);
