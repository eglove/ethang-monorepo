import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { PlusIcon, RotateCwIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

type SectionHeaderProperties = {
  children?: ReactNode;
  header: string;
  isFetching?: boolean;
  modalLabel: string;
  openModal: () => void;
  refreshKeys?: (object | string)[];
};

export const SectionHeader = ({
  children,
  header,
  isFetching,
  modalLabel,
  openModal,
  refreshKeys,
}: Readonly<SectionHeaderProperties>) => {
  const queryClient = useQueryClient();
  const invalidate = useDebouncedCallback(() => {
    if (!isNil(refreshKeys)) {
      queryClient
        .invalidateQueries({ queryKey: refreshKeys })
        .catch(globalThis.console.error);
    }
  }, 1000);

  return (
    <>
      <div className="my-4 flex items-center justify-between gap-4">
        <div className="prose">
          <h2 className="text-foreground">{header}</h2>
        </div>
        <div className="hidden sm:block">{children}</div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            color="primary"
            isLoading={true === isFetching}
            onPress={invalidate}
            size="sm"
          >
            <RotateCwIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              openModal();
            }}
            aria-label={modalLabel}
            color="primary"
            size="sm"
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
      <div className="my-4 sm:hidden">{children}</div>
    </>
  );
};
