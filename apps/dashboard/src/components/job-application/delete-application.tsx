import { useMutation } from "@apollo/client/react";
import { Button } from "@heroui/react";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { deleteJobApplication } from "../../graphql/mutations/delete-job-application.ts";
import {
  type FetchedApplication,
  getAllApplications,
} from "../../graphql/queries/get-all-applications.ts";
import { applicationStore } from "../../stores/application-store.ts";

export const DeleteApplication = ({
  application,
}: Readonly<{ application: FetchedApplication }>) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteApplication, { loading }] = useMutation(deleteJobApplication);

  return (
    <div className="flex items-center gap-2">
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              applicationStore.setApplicationToUpdate(application);
              applicationStore.setIsUpdateModalOpen(true);
            }}
            aria-label="Update Application"
            color="primary"
            size="sm"
          >
            <PencilIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(true);
            }}
            aria-label="Delete"
            color="danger"
            isLoading={loading}
            size="sm"
          >
            <Trash2Icon />
          </Button>
        </>
      )}
      {isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              deleteApplication({
                onCompleted: () => {
                  setIsDeleting(false);
                },
                refetchQueries: [getAllApplications],
                variables: { input: { id: application.id } },
              }).catch(globalThis.console.error);
            }}
            aria-label="Confirm delete"
            color="danger"
            isLoading={loading}
            size="sm"
          >
            <CheckIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(false);
            }}
            aria-label="Cancel delete"
            isLoading={loading}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
