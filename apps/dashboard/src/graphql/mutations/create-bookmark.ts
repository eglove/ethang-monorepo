import { gql } from "@apollo/client";

export const createBookmark = gql`
  mutation CreateBookmark($input: CreateBookmarkInput!) {
    createBookmark(input: $input) {
      id
    }
  }
`;
