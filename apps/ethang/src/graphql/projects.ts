import { gql } from "@apollo/client";

export const TECH_FRAGMENT = gql`
  fragment TechFields on Tech {
    id
    name
  }
`;

export const PROJECT_FRAGMENT = gql`
  fragment ProjectFields on Project {
    code
    description
    id
    publicUrl
    techs {
      ...TechFields
    }
    title
  }
  ${TECH_FRAGMENT}
`;

export type GetProject = {
  project: Project;
};

export type GetProjectIds = {
  projects: {
    id: string;
  }[];
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
      id
    }
  }
`;

export const getProject = gql`
  query Project($id: String!) {
    project(id: $id) {
      ...ProjectFields
    }
  }
  ${PROJECT_FRAGMENT}
`;
