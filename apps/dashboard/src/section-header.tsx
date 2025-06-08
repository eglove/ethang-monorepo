import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon, RotateCwIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

type SectionHeaderProperties = {
  children?: ReactNode;
  header: string;
  isFetching?: boolean;
  modalLabel: string;
  openModal: () => void;
  refreshKeys: (object | string)[];
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
      <div className="sm:hidden my-4">{children}</div>
    </>
  );
};
