import { gql } from "@apollo/client";

export const getPathIds = gql`
  query PathIds {
    paths {
      courseCount
      id
      name
      url
    }
  }
`;

export type PathsQuery = {
  paths: {
    courseCount: number;
    id: string;
    name: string;
    url: string;
  }[];
};

export const getPaths = gql`
  query PathIds {
    paths {
      courseCount
      id
      name
      url
    }
  }
`;

export type PathQuery = {
  path: {
    courses: {
      id: string;
    }[];
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
        id
      }
    }
  }
`;
