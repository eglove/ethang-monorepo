import { gql } from "@apollo/client";

export type GetProjectIds = {
  projects: {
    edges: {
      node: {
        id: string;
      };
    }[];
  };
};

export const getProjectIds = gql`
  query ProjectIds {
    projects {
      edges {
        node {
          id
        }
      }
    }
  }
`;
