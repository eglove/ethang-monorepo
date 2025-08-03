import type { GraphQLResolveInfo } from "graphql/type";

import type {
  contactsCreateInput,
  contactsModel,
} from "../../generated/prisma/models/contacts.ts";
import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllContactsResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.contacts.findMany({
    orderBy: [{ expectedNextContact: "asc" }, { lastContact: "asc" }],
    select: prismaSelect(info),
    where: {
      userId: context.userId,
    },
  });
};

export const createContactResolver = async (
  _: never,
  _arguments: { input: contactsCreateInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.contacts.create({
    data: {
      email: _arguments.input.email ?? null,
      expectedNextContact: _arguments.input.expectedNextContact ?? null,
      lastContact: _arguments.input.lastContact,
      linkedIn: _arguments.input.linkedIn ?? null,
      name: _arguments.input.name,
      phone: _arguments.input.phone ?? null,
      userId: context.userId,
    },
    select: prismaSelect(info),
  });
};

export const updateContactResolver = async (
  _: never,
  _arguments: { input: { id: string } & contactsCreateInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.contacts.update({
    data: {
      email: _arguments.input.email ?? null,
      expectedNextContact: _arguments.input.expectedNextContact ?? null,
      lastContact: _arguments.input.lastContact,
      linkedIn: _arguments.input.linkedIn ?? null,
      name: _arguments.input.name,
      phone: _arguments.input.phone ?? null,
    },
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};

export const deleteContactResolver = async (
  _: never,
  _arguments: { input: Pick<contactsModel, "id"> },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.contacts.delete({
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};
