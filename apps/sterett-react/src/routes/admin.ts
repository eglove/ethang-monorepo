import { createRoute } from "@tanstack/react-router";
import constant from "lodash/constant.js";

import { rootRoute } from "../router/router.ts";

export const adminRoute = createRoute({
  beforeLoad() {
    location.href = "https://admin.sterettcreekvillagetrustee.com";
  },
  component: constant(null),
  getParentRoute() {
    return rootRoute;
  },
  path: "/admin",
});
