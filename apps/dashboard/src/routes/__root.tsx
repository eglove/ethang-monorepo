import {
  ColorModeProvider,
  ColorModeScript,
  cookieStorageManagerSSR,
} from "@kobalte/core";
import { clientOnly } from "@solidjs/start";
import { createRootRoute, Outlet } from "@tanstack/solid-router";
import get from "lodash/get.js";
import isNil from "lodash/isNil";
import { Suspense } from "solid-js";
import { isServer } from "solid-js/web";
import { getCookie } from "vinxi/http";

const Devtools = clientOnly(
  async () => import("../components/development-tools.tsx"),
);

const getServerCookies = () => {
  "use server";
  const colorMode = getCookie("kb-color-mode");
  return isNil(colorMode) ? "" : `kb-color-mode=${colorMode}`;
};

const RootComponent = () => {
  const storageManager = cookieStorageManagerSSR(
    isServer ? getServerCookies() : get(globalThis, ["document", "cookie"]),
  );

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <Suspense>
          <Outlet />
          <Devtools />
        </Suspense>
      </ColorModeProvider>
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
