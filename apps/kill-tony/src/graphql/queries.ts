import { gql } from "@apollo/client";

import type { Appearance, Episode } from "../../generated/prisma/client.ts";

export type GetEpisodes = { episodes: Pick<Episode, "number">[] };

export const getEpisodes = gql`
  query GetEpisodes {
    episodes {
      number
    }
  }
`;

export type GetEpisode = {
  episode: {
    appearances: Pick<
      Appearance,
      "isBucketPull" | "isGuest" | "isRegular" | "name"
    >[];
  } & Pick<Episode, "title" | "url">;
};

export const getEpisode = gql`
  query GetEpisode($number: Int!) {
    episode(number: $number) {
      title
      url
      number
      appearances {
        name
        isGuest
        isRegular
        isBucketPull
      }
    }
  }
`;

export type GetAppearance = {
  appearance: {
    episodes: Pick<Episode, "number">[];
  } & Pick<Appearance, "name">;
};

export const getAppearance = gql`
  query GetAppearance($name: String!) {
    appearance(name: $name) {
      name
      episodes {
        number
      }
    }
  }
`;

export type GetAppearances = {
  appearances: Pick<Appearance, "id" | "name">[];
};

export const getAppearances = gql`
  query GetAppearances {
    appearances {
      id
      name
    }
  }
`;
