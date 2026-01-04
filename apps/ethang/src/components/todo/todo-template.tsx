import type { ReactNode } from "react";

import { MainLayout } from "../main-layout.tsx";
import { TypographyH1 } from "../typography/typography-h1.tsx";

type TodoTemplateProperties = {
  readonly addTodoForm: ReactNode;
  readonly todoList: ReactNode;
};

export const TodoTemplate = ({
  addTodoForm,
  todoList,
}: TodoTemplateProperties) => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4">
        <TypographyH1>Todo List</TypographyH1>
        {addTodoForm}
        {todoList}
      </div>
    </MainLayout>
  );
};
