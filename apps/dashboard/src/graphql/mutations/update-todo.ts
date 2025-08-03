import { gql } from "@apollo/client";

export const updateTodo = gql`
  mutation UpdateTodo($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      id
    }
  }
`;
