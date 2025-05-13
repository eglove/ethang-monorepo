import type { Dispatch, SetStateAction } from "react";

import { Pagination } from "@heroui/react";
import isNil from "lodash/isNil";

import { APPLICATION_PAGE_SIZE } from "@/data/queries.ts";

type JobTrackerTableFooterProperties = Readonly<{
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number | undefined;
}>;

export const JobTrackerTableFooter = ({
  page,
  setPage,
  total,
}: JobTrackerTableFooterProperties) => {
  if (isNil(total)) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Pagination
        isCompact
        loop
        showControls
        onChange={setPage}
        page={page}
        total={Math.ceil(total / APPLICATION_PAGE_SIZE)}
      />
    </div>
  );
};
