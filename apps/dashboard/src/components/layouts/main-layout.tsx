import type { PropsWithChildren } from "react";

import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import { useLocation } from "@tanstack/react-router";
import capitalize from "lodash/capitalize.js";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import split from "lodash/split.js";

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
  const location = useLocation();
  const paths = filter(
    split(location.pathname, "/"),
    (value) => !isEmpty(value),
  );

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-lvh">
      <Navigation />
      <main className="px-4 max-w-5xl mx-auto w-full">
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
      <footer>
        <Breadcrumbs
          classNames={{ base: "w-full", list: "max-w-full" }}
          itemsAfterCollapse={2}
          itemsBeforeCollapse={1}
          maxItems={4}
          radius="none"
          variant="bordered"
        >
          <BreadcrumbItem href="/" underline="hover">
            Home
          </BreadcrumbItem>
          {map(paths, (path, index) => {
            return (
              <BreadcrumbItem
                href={join(slice(paths, 0, index + 1), "/")}
                underline="hover"
              >
                {capitalize(path)}
              </BreadcrumbItem>
            );
          })}
        </Breadcrumbs>
      </footer>
    </div>
  );
};
