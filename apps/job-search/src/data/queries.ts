import { getApplicationById } from "@/data/methods/get-application-by-id.ts";
import {
  type ApplicationsFilter,
  getApplications,
} from "@/data/methods/get-applications.ts";
import { getGlobalStats } from "@/data/methods/get-global-stats.ts";
import { getQas } from "@/data/methods/get-qas.ts";

export const APPLICATION_PAGE_SIZE = 10;

export const queryKeys = {
  applications: () => ["application"],
  getApplication: (id: string | undefined) => ["application", "get", id],
  getApplications: (_filter?: ApplicationsFilter) => [
    "application",
    "get",
    _filter,
  ],
  getQas: () => ["qa", "get"],
  qas: () => ["qa"],
  stats: () => ["stats"],
  statsGlobal: () => ["stats", "global"],
  statsUser: () => ["stats", "user"],
};

export const queries = {
  getApplicationById,
  getApplications,
  getGlobalStats,
  getQas,
};
