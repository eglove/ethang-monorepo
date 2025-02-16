import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries";
import { useToggle } from "@ethang/hooks/src/use-toggle.ts";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon, XIcon } from "lucide-react";

type DeleteQaProperties = Readonly<{
  id: string;
}>;

export const DeleteQa = ({ id }: DeleteQaProperties) => {
  const [isConfirming, toggleIsConfirming] = useToggle(false);
  const queryClient = useQueryClient();
  const deleteQa = useMutation({
    ...mutations.deleteQa(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.getQas() });
    },
  });

  console.log(id);

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
