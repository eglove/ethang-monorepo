import type { GraphQLResolveInfo } from "graphql/type";

import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllQuestionAnswersResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.questionAnswers.findMany({
    select: prismaSelect(info),
    where: {
      userId: context.userId,
    },
  });
};

type CreateQuestionAnswerInput = {
  answer: string;
  question: string;
};

export const createQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: CreateQuestionAnswerInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.questionAnswers.create({
    data: {
      answer: _arguments.input.answer,
      question: _arguments.input.question,
      userId: context.userId,
    },
    select: prismaSelect(info),
  });
};

type UpdateQuestionAnswerInput = {
  answer: string;
  id: string;
  question: string;
};

export const updateQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: UpdateQuestionAnswerInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.questionAnswers.update({
    data: {
      answer: _arguments.input.answer,
      question: _arguments.input.question,
    },
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};

type DeleteQuestionAnswerInput = {
  id: string;
};

export const deleteQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: DeleteQuestionAnswerInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.questionAnswers.delete({
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
      userId: context.userId,
    },
  });
};
