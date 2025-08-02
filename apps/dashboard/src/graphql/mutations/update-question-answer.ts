import { gql } from "@apollo/client";

export const updateQuestionAnswer = gql`
  mutation UpdateQuestionAnswer($input: UpdateQuestionAnswerInput!) {
    updateQuestionAnswer(input: $input) {
      id
    }
  }
`;
