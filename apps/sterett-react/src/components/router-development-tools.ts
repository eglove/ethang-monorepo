import constant from "lodash/constant.js";
import { lazy } from "react";

export const RouterDevelopmentTools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () => {
        return import("@tanstack/router-devtools").then((result) => {
          return {
            default: result.TanStackRouterDevtools,
          };
        });
      });
