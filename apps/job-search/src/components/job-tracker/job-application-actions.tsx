import { AddEditApplication } from "@/components/add-edit-application/add-edit-application.tsx";
import { FormEditButton } from "@/components/form/form-edit-button.tsx";
import { deleteJobApplication } from "@/data/methods/delete-job-application.ts";
import { useMutation } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";

type DeleteJobApplicationProperties = Readonly<{
  id: string;
}>;

export const JobApplicationActions = ({
  id,
}: DeleteJobApplicationProperties) => {
  const deleteApplication = useMutation({
    mutationFn: deleteJobApplication,
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
