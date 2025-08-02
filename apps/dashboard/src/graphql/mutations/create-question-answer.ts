import { gql } from "@apollo/client";

export const createQuestionAnswer = gql`
  mutation CreateQuestionAnswer($input: CreateQuestionAnswerInput!) {
    createQuestionAnswer(input: $input) {
      id
    }
  }
`;
