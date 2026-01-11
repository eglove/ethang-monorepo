import { gql } from "@apollo/client";

import type { CourseModel } from "../../generated/prisma/models/Course.ts";
import type { PathModel } from "../../generated/prisma/models/Path.ts";
import type { ProjectModel } from "../../generated/prisma/models/Project.ts";
import type { TechModel } from "../../generated/prisma/models/Tech.ts";

type CourseFragment = Pick<CourseModel, "author" | "id" | "name" | "url">;

const courseFragment = gql`
  fragment CourseFragment on Course {
    id
    name
    author
    url
  }
`;

export type GetCourse = {
  course: CourseFragment;
};

export const getCourse = gql`
  query Course($id: String!) {
    course(id: $id) {
      ...CourseFragment
    }
  }
  ${courseFragment}
`;

export type GetPaths = {
  paths: {
    _count: {
      __typename: string;
      courses: number;
    };
  } & { courses: CourseFragment[] } & Pick<
      PathModel,
      "id" | "name" | "order" | "url"
    >[];
};

export const getPaths = gql`
  query PathIds {
    paths {
      _count {
        courses
      }
      courses {
        ...CourseFragment
      }
      id
      name
      url
      order
    }
  }
  ${courseFragment}
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
