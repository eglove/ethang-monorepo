import { gql } from "@apollo/client";

import type { Appearance, Episode } from "../../generated/prisma/client.ts";

export type GetEpisodes = { episodes: Pick<Episode, "number">[] };

export const getEpisodes = gql`
  query GetEpisodes {
    episodes(orderBy: { number: desc }) {
      number
    }
  }
`;

export type GetEpisode = {
  episode: { bucketPulls: Pick<Appearance, "name">[] } & {
    goldenTicketCashIns: Pick<Appearance, "name">[];
  } & {
    guests: Pick<Appearance, "name">[];
  } & { regulars: Pick<Appearance, "name">[] } & Pick<
      Episode,
      "number" | "title" | "url"
    > &
    Pick<Episode, "title" | "url">;
};

export const getEpisode = gql`
  query GetEpisode($number: Int!) {
    episode(where: { number: $number }) {
      title
      url
      number
      guests {
        name
      }
      regulars {
        name
      }
      bucketPulls {
        name
      }
      goldenTicketCashIns {
        name
      }
    }
  }
`;

export type GetAppearance = {
  appearance: {
    bucketPullsIn: Pick<Episode, "number">[];
  } & {
    cashedGoldenTicketIn: Pick<Episode, "number">[];
  } & {
    guestsIn: Pick<Episode, "number">[];
  } & {
    regularsIn: Pick<Episode, "number">[];
  } & Pick<Appearance, "name">;
};

export const getAppearance = gql`
  query GetAppearance($name: String!) {
    appearance(where: { name: $name }) {
      name
      guestsIn {
        number
      }
      bucketPullsIn {
        number
      }
      cashedGoldenTicketIn {
        number
      }
      regularsIn {
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
