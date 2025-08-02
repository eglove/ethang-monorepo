import { gql } from "@apollo/client";

export const createContact = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`;
