import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { PlusIcon } from "lucide-react";

import { modalStore } from "../global-stores/modal-store.ts";

export const Footer = () => {
  return (
    <div className="absolute bottom-0 right-0 m-4 z-5">
      <Dropdown>
        <DropdownTrigger>
          <Button color="primary" size="sm">
            Add <PlusIcon className="size-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          onAction={(key) => {
            switch (key) {
              case "bookmark": {
                modalStore.openModal("createBookmark");
                break;
              }

              case "jobApplication": {
                modalStore.openModal("createJobApplication");
                break;
              }

              case "qa": {
                modalStore.openModal("createQa");
              }
            }
          }}
          aria-label="Select item to create"
        >
          <DropdownItem key="bookmark">Bookmark</DropdownItem>
          <DropdownItem key="jobApplication">Job Application</DropdownItem>
          <DropdownItem key="qa">Job Application Q/A</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
