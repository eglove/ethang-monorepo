import type { Dispatch, SetStateAction } from "react";

import { APPLICATION_PAGE_SIZE } from "@/data/queries.ts";
import { Button } from "@heroui/react";

type JobTrackerTableFooterProperties = Readonly<{
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
}>;

export const JobTrackerTableFooter = ({
  page,
  setPage,
  total,
}: JobTrackerTableFooterProperties) => {
  return (
    <div className="items-center my-4 flex justify-between">
      <div className="flex gap-4">
        <Button
          onPress={() => {
            setPage((previous) => {
              if (1 === previous) {
                return previous;
              }

              return previous - 1;
            });
          }}
          isDisabled={1 === page}
          size="sm"
          variant="bordered"
        >
          Previous
        </Button>
        <Button
          onPress={() => {
            setPage((previous) => {
              return previous + 1;
            });
          }}
          isDisabled={APPLICATION_PAGE_SIZE > total}
          size="sm"
          variant="bordered"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
