import { AddEditApplication } from "@/components/add-edit-application/add-edit-application.tsx";
import { FormEditButton } from "@/components/form/form-edit-button.tsx";
import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";

type DeleteJobApplicationProperties = Readonly<{
  id: string;
}>;

export const JobApplicationActions = ({
  id,
}: DeleteJobApplicationProperties) => {
  const queryClient = useQueryClient();
  const deleteApplication = useMutation({
    ...mutations.deleteJobApplication(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applications(),
      });
    },
  });

  return (
    <FormEditButton
      handleDelete={() => {
        deleteApplication.mutate(id);
      }}
    >
      <AddEditApplication
        triggerProperties={{
          color: "default",
          isIconOnly: true,
          title: "Update Application",
        }}
        id={id}
      >
        <PencilIcon className="size-4" />
      </AddEditApplication>
    </FormEditButton>
  );
};
