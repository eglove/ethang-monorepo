import { gql } from "@apollo/client";

import { type Course, COURSE_FRAGMENT } from "./course.ts";

export const PATH_FRAGMENT = gql`
  fragment PathFields on Path {
    courseCount
    id
    name
    url
  }
`;

export const getPathIds = gql`
  query PathIds {
    paths {
      ...PathFields
    }
  }
  ${PATH_FRAGMENT}
`;

export type Path = {
  courseCount: number;
  id: string;
  name: string;
  url: string;
};

export type PathsQuery = {
  paths: Path[];
};

export const getPaths = gql`
  query PathIds {
    paths {
      ...PathFields
    }
  }
  ${PATH_FRAGMENT}
`;

export type PathQuery = {
  path: {
    courses: Course[];
    id: string;
    name: string;
  };
};

export const getPath = gql`
  query Path($id: String!) {
    path(id: $id) {
      id
      name
      courses {
        ...CourseFields
      }
    }
  }
  ${COURSE_FRAGMENT}
`;
