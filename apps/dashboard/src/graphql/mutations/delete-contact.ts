import { gql } from "@apollo/client";

export const deleteContact = gql`
  mutation DeleteContact($input: DeleteContactInput!) {
    deleteContact(input: $input) {
      id
    }
  }
`;
