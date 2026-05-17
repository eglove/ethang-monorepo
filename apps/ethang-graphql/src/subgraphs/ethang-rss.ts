import isNil from "lodash/isNil.js";

export const ethangRssFetcher = async (environment: Env, request: Request) => {
  if (!isNil(environment.ethang_rss)) {
    return environment.ethang_rss.fetch(request);
  }

  return fetch(request);
};
