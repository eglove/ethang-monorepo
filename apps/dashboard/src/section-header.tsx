import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon, RotateCwIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { type IsOpenKeys, modalStore } from "./global-stores/modal-store.ts";

type SectionHeaderProperties = {
  children?: ReactNode;
  header: string;
  modalKey: IsOpenKeys;
  modalLabel: string;
  refreshKeys: (object | string)[];
};

export const SectionHeader = ({
  children,
  header,
  modalKey,
  modalLabel,
  refreshKeys,
}: Readonly<SectionHeaderProperties>) => {
  const queryClient = useQueryClient();
  const invalidate = useDebouncedCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: refreshKeys })
      .catch(globalThis.console.error);
  }, 1000);

  return (
    <>
      <div className="flex justify-between items-center my-4 gap-4">
        <div className="prose">
          <h2 className="text-foreground">{header}</h2>
        </div>
        <div className="hidden sm:block">{children}</div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            isLoading={
              "fetching" === queryClient.getQueryState(refreshKeys)?.fetchStatus
            }
            color="primary"
            onPress={invalidate}
            size="sm"
          >
            <RotateCwIcon />
          </Button>
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
      </div>
      <div className="sm:hidden my-4">{children}</div>
    </>
  );
};
