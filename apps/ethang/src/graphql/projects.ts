import { gql } from "@apollo/client";

export type GetProject = {
  project: Project;
};

export type GetProjectIds = {
  projects: {
    projects: {
      id: string;
    }[];
  };
};

export type Project = {
  code: string;
  description: string;
  id: string;
  publicUrl?: string;
  techs: Tech[];
  title: string;
};

export type Tech = {
  id: string;
  name: string;
};

export const getProjectIds = gql`
  query ProjectIds($where: ProjectWhereInput) {
    projects(where: $where) {
      projects {
        id
      }
    }
  }
`;

export const getProject = gql`
  query Project($id: String!) {
    project(id: $id) {
      id
      title
      description
      code
      publicUrl
      techs {
        id
        name
      }
    }
  }
`;
