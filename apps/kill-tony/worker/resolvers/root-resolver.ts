import { createAppearanceMutation } from "./mutation/appearance.ts";
import {
  addAppearanceToEpisodeMutation,
  createEpisodeMutation,
} from "./mutation/episode.ts";
import {
  appearanceResolver,
  appearancesResolver,
} from "./queries/appearance-resolver.ts";
import {
  episodeResolver,
  episodesResolver,
} from "./queries/episode-resolver.ts";

export const rootResolver = {
  Mutation: {
    addAppearanceToEpisode: addAppearanceToEpisodeMutation,
    createAppearance: createAppearanceMutation,
    createEpisode: createEpisodeMutation,
  },
  Query: {
    appearance: appearanceResolver,
    appearances: appearancesResolver,
    episode: episodeResolver,
    episodes: episodesResolver,
  },
};
