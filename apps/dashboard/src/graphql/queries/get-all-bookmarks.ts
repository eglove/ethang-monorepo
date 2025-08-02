import { gql } from "@apollo/client";

import type { bookmarksModel } from "../../../generated/prisma/models.ts";

export type GetAllBookmarks = {
  bookmarks: Pick<bookmarksModel, "id" | "title" | "url" | "userId">[];
};

export const getAllBookmarks = gql`
  query GetBookmarks {
    bookmarks {
      id
      title
      url
      userId
    }
  }
`;
