import { gql } from "@apollo/client";

export const deleteTodo = gql`
  mutation DeleteTodo($input: DeleteTodoInput!) {
    deleteTodo(input: $input) {
      id
    }
  }
`;
