import { gql } from "@apollo/client";

export type CourseQuery = {
  course: {
    author: string;
    id: string;
    name: string;
    url: string;
  };
};

export const getCourse = gql`
  query Course($id: String!) {
    course(id: $id) {
      author
      id
      name
      url
    }
  }
`;
