import type { ApplicationsFilter } from "@/data/methods/get-applications.ts";

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
