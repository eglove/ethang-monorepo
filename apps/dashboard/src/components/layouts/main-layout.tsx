import type { PropsWithChildren } from "react";

import { SignedIn, SignedOut } from "@clerk/clerk-react";

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
import { UpdateTodoModal } from "../todo/update-todo-modal.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <Navigation />
      <main className="px-4 max-w-5xl mx-auto">
        <SignedIn>
          {children}
          <CreateBookmarkModal />
          <UpdateBookmarkModal />
          <CreateJobApplicationModal />
          <UpdateJobApplicationModal />
          <CreateQaModal />
          <UpdateQaModal />
          <CreateContactModal />
          <UpdateContactModal />
          <CreateTodoModal />
          <UpdateTodoModal />
        </SignedIn>
        <SignedOut>
          <h1 className="text-3xl font-bold text-center">
            Sign In to Get Started
          </h1>
        </SignedOut>
      </main>
    </>
  );
};
