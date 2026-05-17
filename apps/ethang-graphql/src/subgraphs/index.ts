import { ethangRssFetcher } from "./ethang-rss.ts";

export const subgraphs: Record<
  string,
  (environment: Env, request: Request) => Promise<Response>
> = {
  "ethang-rss": ethangRssFetcher
};
