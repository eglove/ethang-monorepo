import { gql } from "@apollo/client";

export const updateBookmark = gql`
  mutation UpdateBookmark($input: UpdateBookmarkInput!) {
    updateBookmark(input: $input) {
      id
    }
  }
`;
