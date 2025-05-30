import type { Dispatch, SetStateAction } from "react";

import { Button, Input } from "@heroui/react";
import { PlusIcon } from "lucide-react";

import { type IsOpenKeys, modalStore } from "./global-stores/modal-store.ts";

type SectionHeaderProperties = {
  header: string;
  modalKey: IsOpenKeys;
  modalLabel: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
};

export const SectionHeader = ({
  header,
  modalKey,
  modalLabel,
  search,
  setSearch,
}: Readonly<SectionHeaderProperties>) => {
  return (
    <div className="flex justify-between items-center my-4">
      <div className="prose">
        <h2 className="text-foreground">{header}</h2>
      </div>
      <div>
        <Input
          aria-label="Search"
          onValueChange={setSearch}
          placeholder="Search"
          size="sm"
          value={search}
        />
      </div>
      <Button
        isIconOnly
        onPress={() => {
          modalStore.openModal(modalKey);
        }}
        aria-label={modalLabel}
        color="primary"
        size="sm"
      >
        <PlusIcon />
      </Button>
    </div>
  );
};
