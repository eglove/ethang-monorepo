export const syncUrl = "https://job-search-sync.ethang.dev";

export const syncUrls = {
  applications: new URL("/applications", syncUrl),
  dataSync: new URL("/data-sync", syncUrl),
  getData: new URL("/get-data", syncUrl),
  globalStats: new URL("/global-stats", syncUrl),
  qas: new URL("/question-answers", syncUrl),
  userStats: new URL("/user-stats", syncUrl),
} as const;
