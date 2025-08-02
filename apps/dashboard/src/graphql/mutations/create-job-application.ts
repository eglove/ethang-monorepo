import { gql } from "@apollo/client";

export const createJobApplication = gql`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      userId
      applied
      company
      title
      url
      jobBoardUrl
      rejected
      dmUrl
      dmSent
    }
  }
`;
