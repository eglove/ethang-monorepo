import { gql } from "@apollo/client";

export const deleteJobApplication = gql`
  mutation DeleteApplication($input: DeleteApplicationInput!) {
    deleteApplication(input: $input) {
      id
    }
  }
`;
