import { TypographyP } from "@/components/typography/typography-p.tsx";
import { mutations } from "@/data/mutations.ts";
import { logger } from "@/lib/logger";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import { type FormEvent, useState } from "react";

export const SignInModal = () => {
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: ({ value }) => {
      mutate(value);
      onClose();
    },
  });

  const { isPending, mutate } = useMutation({
    ...mutations.signIn(),
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit().catch(logger.error);
  };

  return (
    <>
      <Button color="primary" onPress={onOpen} size="sm">
        Sign In
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(_onClose) => {
            return (
              <>
                <ModalHeader>Sign In</ModalHeader>
                <Form onSubmit={handleSubmit}>
                  <ModalBody className="w-full">
                    <form.Field name="email">
                      {(fieldApi) => {
                        return (
                          <Input
                            isRequired
                            label="Email"
                            name={fieldApi.name}
                            onBlur={fieldApi.handleBlur}
                            onValueChange={fieldApi.handleChange}
                            type="email"
                            value={fieldApi.state.value}
                          />
                        );
                      }}
                    </form.Field>
                    <form.Field name="password">
                      {(fieldApi) => {
                        return (
                          <Input
                            isRequired
                            label="Password"
                            name={fieldApi.name}
                            onBlur={fieldApi.handleBlur}
                            onValueChange={fieldApi.handleChange}
                            type="password"
                            value={fieldApi.state.value}
                          />
                        );
                      }}
                    </form.Field>
                    {!isEmpty(errorMessage) && (
                      <TypographyP>{errorMessage}</TypographyP>
                    )}
                  </ModalBody>
                  <ModalFooter className="w-full">
                    <Button color="danger" onPress={_onClose} variant="light">
                      Close
                    </Button>
                    <Button color="primary" isLoading={isPending} type="submit">
                      Sign In
                    </Button>
                  </ModalFooter>
                </Form>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
