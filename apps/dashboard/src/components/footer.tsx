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
    <div className="absolute bottom-0 right-1/2 m-4 z-5">
      <Dropdown>
        <DropdownTrigger>
          <Button color="primary" size="sm">
            Add <PlusIcon className="size-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          onAction={(key) => {
            if ("bookmark" === key) {
              modalStore.openModal("createBookmark");
            }

            if ("jobApplication" === key) {
              modalStore.openModal("createJobApplication");
            }
          }}
          aria-label="Select item to create"
        >
          <DropdownItem key="bookmark">Bookmark</DropdownItem>
          <DropdownItem key="jobApplication">Job Application</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
