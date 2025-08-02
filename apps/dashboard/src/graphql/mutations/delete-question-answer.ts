import { gql } from "@apollo/client";

export const deleteQuestionAnswer = gql`
  mutation DeleteQuestionAnswer($input: DeleteQuestionAnswerInput!) {
    deleteQuestionAnswer(input: $input) {
      id
    }
  }
`;
