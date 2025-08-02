import { gql } from "@apollo/client";

import type { contactsModel } from "../../generated/prisma/models/contacts.ts";

export type FetchedContact = Pick<
  contactsModel,
  | "email"
  | "expectedNextContact"
  | "id"
  | "lastContact"
  | "linkedIn"
  | "name"
  | "phone"
  | "userId"
>;

export type GetAllContacts = {
  contacts: FetchedContact[];
};

export const getAllContacts = gql`
  query GetContacts {
    contacts {
      email
      expectedNextContact
      id
      lastContact
      linkedIn
      name
      phone
      userId
    }
  }
`;
