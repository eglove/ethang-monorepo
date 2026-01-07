import { gql } from "@apollo/client";

export const COURSE_FRAGMENT = gql`
  fragment CourseFields on Course {
    author
    id
    name
    url
  }
`;

export type Course = {
  author: string;
  id: string;
  name: string;
  url: string;
};

export type CourseQuery = {
  course: Course;
};

export const getCourse = gql`
  query Course($id: String!) {
    course(id: $id) {
      ...CourseFields
    }
  }
  ${COURSE_FRAGMENT}
`;
