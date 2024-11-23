import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";

import { environment } from "../environment.ts";

export const convex = new ConvexReactClient(environment.VITE_CONVEX_URL);
export const convexQueryClient = new ConvexQueryClient(convex);
