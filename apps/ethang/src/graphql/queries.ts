import { gql } from "@apollo/client";

import type { CourseModel } from "../../generated/prisma/models/Course.ts";
import type { PathModel } from "../../generated/prisma/models/Path.ts";
import type { ProjectModel } from "../../generated/prisma/models/Project.ts";
import type { TechModel } from "../../generated/prisma/models/Tech.ts";

export type GetCourse = {
  course: Pick<CourseModel, "author" | "id" | "name" | "url">;
};

export const getCourse = gql`
  query Course($id: String!) {
    course(id: $id) {
      id
      author
      name
      url
    }
  }
`;

export type GetPaths = {
  paths: {
    _count: {
      __typename: string;
      courses: number;
    };
  } & Pick<PathModel, "id" | "name" | "url">[];
};

export const getPaths = gql`
  query PathIds {
    paths {
      _count {
        courses
      }
      id
      name
      url
    }
  }
`;

export type GetPathCourseIds = {
  path: {
    courses: Pick<CourseModel, "id">[];
  } & Pick<PathModel, "id">;
};

export const getPathCourseIds = gql`
  query PathCourseIds($id: String!) {
    path(id: $id) {
      courses {
        id
      }
      id
    }
  }
`;

export type GetProjectIds = {
  projects: Pick<ProjectModel, "id">[];
};

export const getProjectIds = gql`
  query ProjectIds($where: ProjectWhereInput) {
    projects(where: $where) {
      id
    }
  }
`;

export type GetProject = {
  project: {
    techs: Pick<TechModel, "id" | "name">[];
  } & Pick<ProjectModel, "code" | "description" | "id" | "publicUrl" | "title">;
};

export const getProject = gql`
  query Project($id: String!) {
    project(id: $id) {
      code
      description
      id
      publicUrl
      techs {
        id
        name
      }
      title
    }
  }
`;
