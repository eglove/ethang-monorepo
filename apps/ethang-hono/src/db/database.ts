import type { Context, Input } from "hono";

import { drizzle } from "drizzle-orm/d1";

import type { AppContext } from "../stores/global-store-properties.ts";

// eslint-disable-next-line sonar/no-wildcard-import
import * as schema from "./schema.ts";

export const getDatabase = <P extends string, I extends Input>(
  context: Context<AppContext, P, I>,
) => {
  return drizzle(context.env.ethang_hono, { schema });
};
