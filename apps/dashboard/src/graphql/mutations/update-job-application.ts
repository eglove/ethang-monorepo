import { gql } from "@apollo/client";

export const updateJobApplication = gql`
  mutation UpdateApplication($input: UpdateApplicationInput!) {
    updateApplication(input: $input) {
      id
    }
  }
`;
