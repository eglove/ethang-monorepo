import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { PlusIcon } from "lucide-react";

import { type IsOpenKeys, modalStore } from "./global-stores/modal-store.ts";

type SectionHeaderProperties = {
  children?: ReactNode;
  header: string;
  modalKey: IsOpenKeys;
  modalLabel: string;
};

export const SectionHeader = ({
  children,
  header,
  modalKey,
  modalLabel,
}: Readonly<SectionHeaderProperties>) => {
  return (
    <div className="flex justify-between items-center my-4">
      <div className="prose">
        <h2 className="text-foreground">{header}</h2>
      </div>
      {children}
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
