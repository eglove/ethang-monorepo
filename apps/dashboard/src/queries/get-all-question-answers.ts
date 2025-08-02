import { gql } from "@apollo/client";

import type { questionAnswersModel } from "../../generated/prisma/models/questionAnswers.ts";

export type FetchedQuestionAnswer = Pick<
  questionAnswersModel,
  "answer" | "id" | "question"
>;

export type GetAllQuestionAnswers = {
  questionAnswers: FetchedQuestionAnswer[];
};

export const getAllQuestionAnswers = gql`
  query GetQuestionAnswers {
    questionAnswers {
      id
      answer
      question
    }
  }
`;
