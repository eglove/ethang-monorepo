import { gql } from "@apollo/client";

export const createEpisode = gql`
  mutation CreateEpisode($input: CreateEpisodeInput!) {
    createEpisode(input: $input) {
      number
    }
  }
`;

export const addAppearanceToEpisode = gql`
  mutation AddAppearanceToEpisode($input: AddAppearanceToEpisodeInput!) {
    addAppearanceToEpisode(input: $input) {
      number
    }
  }
`;
