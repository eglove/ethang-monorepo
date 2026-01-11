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

export type CreateCourse = {
  createCourse: { id: string; name: string; url: string };
};

export const createCourse = gql`
  mutation CreateCourse($data: CreateCourseInput!) {
    createCourse(data: $data) {
      id
      name
      url
    }
  }
`;

export type UpdateCourse = {
  updateCourse: { id: string; name: string; url: string };
};

export const updateCourse = gql`
  mutation UpdateCourse($id: String!, $data: UpdateCourseInput!) {
    updateCourse(id: $id, data: $data) {
      id
      name
      url
    }
  }
`;

export type DeleteCourse = {
  deleteCourse: { id: string };
};

export const deleteCourse = gql`
  mutation DeleteCourse($id: String!) {
    deleteCourse(id: $id) {
      id
    }
  }
`;
