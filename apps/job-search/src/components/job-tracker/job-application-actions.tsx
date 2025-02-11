import { FormEditButton } from "@/components/form/form-edit-button.tsx";
import { Button } from "@/components/ui/button.tsx";
import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
      <Button asChild size="icon" variant="secondary">
        <Link to={`/upsert-application?id=${id}`}>
          <PencilIcon />
        </Link>
      </Button>
    </FormEditButton>
  );
};
