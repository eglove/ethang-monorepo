import type { PropsWithChildren } from "react";

import { SignedIn } from "@clerk/clerk-react";

import { CreateBookmarkModal } from "../bookmarks/create-bookmark-modal.tsx";
import { UpdateBookmarkModal } from "../bookmarks/update-bookmark-modal.tsx";
import { CreateContactModal } from "../contact/create-contact-modal.tsx";
import { UpdateContactModal } from "../contact/update-contact-modal.tsx";
import { CreateJobApplicationModal } from "../job-application/create-job-application-modal.tsx";
import { UpdateJobApplicationModal } from "../job-application/update-job-application-modal.tsx";
import { Navigation } from "../navigation.tsx";
import { CreateQaModal } from "../qa/create-qa-modal.tsx";
import { UpdateQaModal } from "../qa/update-qa-modal.tsx";
import { CreateTodoModal } from "../todo/create-todo-modal.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <Navigation />
      <SignedIn>
        <main className="px-4 max-w-5xl mx-auto">{children}</main>
        <CreateBookmarkModal />
        <UpdateBookmarkModal />
        <CreateJobApplicationModal />
        <UpdateJobApplicationModal />
        <CreateQaModal />
        <UpdateQaModal />
        <CreateContactModal />
        <UpdateContactModal />
        <CreateTodoModal />
      </SignedIn>
    </>
  );
};
