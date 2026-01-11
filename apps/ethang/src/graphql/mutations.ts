import { gql } from "@apollo/client";

import type { PathModel } from "../../generated/prisma/models/Path.ts";

export type CreatePath = {
  createPath: Pick<PathModel, "id" | "name" | "order" | "url">;
};

export const createPath = gql`
  mutation CreatePath($data: CreatePathInput!) {
    createPath(data: $data) {
      id
      name
      order
      url
    }
  }
`;

export type UpdatePath = {
  updatePath: Pick<PathModel, "id" | "name" | "order" | "url">;
};

export const updatePath = gql`
  mutation UpdatePath($id: String!, $data: UpdatePathInput!) {
    updatePath(id: $id, data: $data) {
      id
      name
      order
      url
    }
  }
`;

export type DeletePath = {
  deletePath: Pick<PathModel, "id">;
};

export const deletePath = gql`
  mutation DeletePath($id: String!) {
    deletePath(id: $id) {
      id
    }
  }
`;
