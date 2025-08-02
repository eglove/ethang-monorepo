import type { GraphQLResolveInfo } from "graphql/type";

import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllBookmarksResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.bookmarks.findMany({
    select: prismaSelect(info),
    where: {
      userId: context.userId,
    },
  });
};

type CreateBookmarkInput = {
  title: string;
  url: string;
};

export const createBookmarkResolver = async (
  _: never,
  _arguments: { input: CreateBookmarkInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.bookmarks.create({
    data: {
      title: _arguments.input.title,
      url: _arguments.input.url,
      userId: context.userId,
    },
    select: prismaSelect(info),
  });
};

type UpdateBookmarkInput = {
  id: string;
  title: string;
  url: string;
};

export const updateBookmarkResolver = async (
  _: never,
  _arguments: { input: UpdateBookmarkInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.bookmarks.update({
    data: {
      title: _arguments.input.title,
      url: _arguments.input.url,
    },
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};

type DeleteBookmarkInput = {
  id: string;
};

export const deleteBookmarkResolver = async (
  _: never,
  _arguments: { input: DeleteBookmarkInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.bookmarks.delete({
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};
