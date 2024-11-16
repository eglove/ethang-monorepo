import { Button } from "@nextui-org/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";
import map from "lodash/map";
import { EyeIcon } from "lucide-react";

import type { Job } from "../../query/job";

import { SanityContent } from "../sanity/sanity-content";

type JobActionsProperties = {
  readonly job: Job;
};

const listFormatter = new Intl.ListFormat(undefined, {
  type: "unit",
}) as { format: (values: string[]) => string };

export const JobActions = ({ job }: JobActionsProperties) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div>
      <Button
        isIconOnly
        onPress={onOpen}
      >
        <EyeIcon className="size-6" />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
      >
        <ModalContent className="overflow-auto">
          {(onClose) => {
            return (
              <>
                <ModalHeader>
                  <h2 className="text-2xl font-bold">
                    {job.title}
                  </h2>
                </ModalHeader>
                <ModalBody>
                  <div className="prose text-foreground">
                    <SanityContent value={job.description} />
                    <h3 className="text-foreground mt-4 font-bold">
                      Tech Used
                    </h3>
                    <p>
                      {listFormatter.format(map(job.techUsed, "name"))}
                    </p>
                    <h3 className="text-foreground mt-4 font-bold">
                      Methodologies Used
                    </h3>
                    <p>
                      {listFormatter.format(map(job.methodologiesUsed, "name"))}
                    </p>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    onPress={onClose}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
};
