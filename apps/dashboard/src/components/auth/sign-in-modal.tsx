import type { FormEvent } from "react";

import { signInSchema } from "@ethang/schemas/auth/user.ts";
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
import { LogInIcon } from "lucide-react";

import { authStore } from "../../stores/auth-store.ts";

export const SignInModal = () => {
  const { isPending, isSignInOpen } = useStore(authStore, (state) => {
    return {
      isPending: state.isPending,
      isSignInOpen: state.isSignInOpen,
    };
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signInSchema.safeParse(data);

    if (parsed.success) {
      authStore.callSignIn(parsed.data).catch(globalThis.console.error);
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
        isIconOnly
        onPress={() => {
          authStore.setIsSignInOpen(true);
        }}
        aria-label="Sign In"
        color="primary"
        size="sm"
      >
        <LogInIcon />
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
