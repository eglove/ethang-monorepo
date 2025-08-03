import type { GraphQLResolveInfo } from "graphql/type";

import type {
  questionAnswersCreateInput,
  questionAnswersModel,
} from "../../generated/prisma/models/questionAnswers.ts";
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

export const createQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: questionAnswersCreateInput },
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

export const updateQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: { id: string } & questionAnswersCreateInput },
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

export const deleteQuestionAnswerResolver = async (
  _: never,
  _arguments: { input: Pick<questionAnswersModel, "id"> },
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
