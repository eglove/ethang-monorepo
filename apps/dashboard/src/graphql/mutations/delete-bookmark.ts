import { gql } from "@apollo/client";

export const deleteBookmark = gql`
  mutation DeleteBookmark($input: DeleteBookmarkInput!) {
    deleteBookmark(input: $input) {
      id
    }
  }
`;
