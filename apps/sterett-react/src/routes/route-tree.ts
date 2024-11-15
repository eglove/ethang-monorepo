import { createRouter } from "@tanstack/react-router";

import { rootRoute } from "../router/router.ts";
import { adminRoute } from "./admin.ts";
import { beyonderRoute } from "./beyonder.tsx";
import { calendarRoute } from "./calendar.tsx";
import { filesRoute } from "./files.tsx";
import { galleryRoute } from "./gallery.tsx";
import { indexRoute } from "./home.tsx";
import { newsRoute } from "./news.tsx";
import { pageIdRoute } from "./page.id.tsx";
import { pageRoute } from "./page.tsx";
import { trusteesRoute } from "./trustees.tsx";

const routeTree = rootRoute.addChildren([
  indexRoute,
  newsRoute,
  calendarRoute,
  filesRoute,
  trusteesRoute,
  galleryRoute,
  adminRoute,
  beyonderRoute,
  pageRoute,
  pageIdRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error allow unused
  type Register = {
    router: typeof router;
  };
}
