import { deleteQa as deleteQaFunction } from "@/data/methods/delete-qa.ts";
import { useToggle } from "@ethang/hooks/use-toggle.js";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { Trash2Icon, XIcon } from "lucide-react";

type DeleteQaProperties = Readonly<{
  id: string;
}>;

export const DeleteQa = ({ id }: DeleteQaProperties) => {
  const [isConfirming, toggleIsConfirming] = useToggle(false);
  const deleteQa = useMutation({
    mutationFn: deleteQaFunction,
  });

  if (isConfirming) {
    return (
      <div className="flex gap-2">
        <Button
          color="warning"
          endContent={<XIcon className="size-5" />}
          onPress={toggleIsConfirming}
        >
          Cancel
        </Button>
        <Button
          onPress={() => {
            deleteQa.mutate(id);
          }}
          color="danger"
          endContent={<Trash2Icon className="size-5" />}
        >
          Confirm Delete
        </Button>
      </div>
    );
  }

  return (
    <Button
      color="danger"
      endContent={<Trash2Icon className="size-5" />}
      onPress={toggleIsConfirming}
    >
      Delete
    </Button>
  );
};
