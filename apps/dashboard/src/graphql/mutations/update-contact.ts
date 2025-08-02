import { gql } from "@apollo/client";

export const updateContact = gql`
  mutation UpdateContact($input: UpdateContactInput!) {
    updateContact(input: $input) {
      id
    }
  }
`;
