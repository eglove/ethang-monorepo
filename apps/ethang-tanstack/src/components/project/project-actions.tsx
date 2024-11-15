import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";
import { EyeIcon } from "lucide-react";

import type { Project } from "../../query/projects";

import { SanityContent } from "../sanity/sanity-content";

type ProjectDetailsProperties = {
  readonly project: Project;
};

export const ProjectActions = ({
  project,
}: ProjectDetailsProperties) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
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
                  {project.name}
                </ModalHeader>
                <ModalBody>
                  <SanityContent value={project.description} />
                  <p>
                    <Link
                      isExternal
                      color="foreground"
                      href={project.url}
                      underline="always"
                    >
                      {project.url}
                    </Link>
                  </p>
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
    </>
  );
};
