import type { FormEvent } from "react";

import { signInSchema } from "@ethang/schemas/src/auth/user.ts";
import { useStore } from "@ethang/store/use-store";
import {
  addToast,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

import { authStore } from "../../stores/auth-store.ts";

export const SignInModal = () => {
  const { isSignInOpen } = useStore(authStore, (state) => {
    return {
      isSignInOpen: state.isSignInOpen,
    };
  });

  const { isPending, mutate } = useMutation(authStore.signIn());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signInSchema.safeParse(data);

    if (parsed.success) {
      mutate(parsed.data);
    } else {
      addToast({
        color: "danger",
        description: parsed.error.message,
        title: "Invalid Input",
      });
    }
  };

  return (
    <>
      <Button
        onPress={() => {
          authStore.setIsSignInOpen(true);
        }}
        color="primary"
      >
        Sign In
      </Button>
      <Modal
        onOpenChange={(value) => {
          authStore.setIsSignInOpen(value);
        }}
        isOpen={isSignInOpen}
      >
        <ModalContent>
          <ModalHeader>Sign In</ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody className="w-full">
              <Input label="Email" name="email" type="email" />
              <Input label="Password" name="password" type="password" />
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                onPress={() => {
                  authStore.setIsSignInOpen(false);
                }}
                color="danger"
              >
                Close
              </Button>
              <Button color="primary" isLoading={isPending} type="submit">
                Sign In
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};
