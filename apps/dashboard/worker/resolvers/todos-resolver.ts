import type { GraphQLResolveInfo } from "graphql/type";

import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllTodosResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.todos.findMany({
    orderBy: { dueDate: "asc" },
    select: prismaSelect(info),
    where: { userId: context.userId },
  });
};

type CreateTodoInput = {
  description?: string;
  dueDate: string;
  recurs?: number;
  title: string;
};

export const createTodoResolver = async (
  _: never,
  _arguments: { input: CreateTodoInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.todos.create({
    data: {
      description: _arguments.input.description ?? null,
      dueDate: _arguments.input.dueDate,
      recurs: _arguments.input.recurs ?? null,
      title: _arguments.input.title,
      userId: context.userId,
    },
    select: prismaSelect(info),
  });
};

type UpdateTodoInput = {
  description?: string;
  dueDate: string;
  id: string;
  recurs?: number;
  title: string;
};

export const updateTodoResolver = async (
  _: never,
  _arguments: { input: UpdateTodoInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.todos.update({
    data: {
      description: _arguments.input.description ?? null,
      dueDate: _arguments.input.dueDate,
      recurs: _arguments.input.recurs ?? null,
      title: _arguments.input.title,
    },
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};

type DeleteTodoInput = {
  id: string;
};

export const deleteTodoResolver = async (
  _: never,
  _arguments: { input: DeleteTodoInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.todos.delete({
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};
