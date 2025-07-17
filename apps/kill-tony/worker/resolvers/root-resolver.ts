import { createAppearanceMutation } from "./mutation/appearance.ts";
import {
  addAppearanceToEpisodeMutation,
  createEpisodeMutation,
} from "./mutation/episode.ts";
import { queryResolver } from "./queries/query-resolver.ts";

export const rootResolver = {
  Mutation: {
    addAppearanceToEpisode: addAppearanceToEpisodeMutation,
    createAppearance: createAppearanceMutation,
    createEpisode: createEpisodeMutation,
  },
  Query: {
    appearance: queryResolver("appearance", "findUnique"),
    appearances: queryResolver("appearance", "findMany"),
    episode: queryResolver("episode", "findUnique"),
    episodes: queryResolver("episode", "findMany"),
  },
};
