import { Button } from "@nextui-org/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";
import { EyeIcon } from "lucide-react";

import type { Certification } from "../../query/certifications";

import { SanityContent } from "../sanity/sanity-content";

type CertificationDetailsProperties = {
  readonly certification: Certification;
};

export const CertificationDetails = ({
  certification,
}: CertificationDetailsProperties) => {
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
                  {certification.name}
                </ModalHeader>
                <ModalBody>
                  <SanityContent value={certification.description} />
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="primary"
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
