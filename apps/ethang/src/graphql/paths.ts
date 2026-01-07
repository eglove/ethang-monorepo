import { gql } from "@apollo/client";

export type PathsQuery = {
  paths: {
    courses: {
      author: string;
      id: string;
      name: string;
      url: string;
    }[];
    id: string;
    name: string;
  }[];
};

export const getPaths = gql`
  query Paths {
    paths {
      courses {
        author
        id
        name
        url
      }
      id
      name
    }
  }
`;

export type PathIdsQuery = {
  paths: {
    courseCount: number;
    id: string;
    name: string;
  }[];
};

export const getPathIds = gql`
  query PathIds {
    paths {
      courseCount
      id
      name
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
