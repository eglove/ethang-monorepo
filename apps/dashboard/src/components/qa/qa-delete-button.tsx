import { useMutation } from "@apollo/client";
import { useToggle } from "@ethang/hooks/use-toggle";
import { Button } from "@heroui/react";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";

import { deleteQuestionAnswer } from "../../graphql/mutations/delete-question-answer.ts";
import { getAllQuestionAnswers } from "../../graphql/queries/get-all-question-answers.ts";

type QaDeleteButtonProperties = {
  id: string;
};

export const QaDeleteButton = ({ id }: Readonly<QaDeleteButtonProperties>) => {
  const [isDeleting, toggleIsDeleting] = useToggle(false);

  const [handleDelete, { loading }] = useMutation(deleteQuestionAnswer);

  return (
    <>
      {!isDeleting && (
        <Button
          isIconOnly
          onPress={() => {
            toggleIsDeleting();
          }}
          aria-label="Delete"
          color="danger"
        >
          <Trash2Icon />
        </Button>
      )}
      {isDeleting && (
        <div className="flex gap-2">
          <Button
            isIconOnly
            onPress={() => {
              handleDelete({
                onCompleted: () => {
                  toggleIsDeleting();
                },
                refetchQueries: [getAllQuestionAnswers],
                variables: {
                  input: { id },
                },
              }).catch(globalThis.console.error);
            }}
            aria-label="Confirm Delete"
            color="primary"
            isLoading={loading}
          >
            <CheckIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              toggleIsDeleting();
            }}
            aria-label="Cancel Delete"
            isLoading={loading}
          >
            <XIcon />
          </Button>
        </div>
      )}
    </>
  );
};
