import type { Dispatch, SetStateAction } from "react";

import { Input } from "@heroui/react";

import type { filesRouteQueries } from "../../routes/files.tsx";

type FileTableBodyProperties = {
  readonly filter: string;
  readonly query: keyof typeof filesRouteQueries;
  readonly setFilter: Dispatch<SetStateAction<string>>;
};

export const FileTableTop = ({
  filter,
  query,
  setFilter,
}: FileTableBodyProperties) => {
  return (
    <>
      <h1 className="mb-4 text-center text-2xl font-bold">
        {"meetingMinutesFiles" === query ? "Meeting Minutes" : "Files"}
      </h1>
      <Input
        size="sm"
        label="Filter"
        value={filter}
        color="primary"
        className="mb-4"
        onValueChange={setFilter}
      />
    </>
  );
};
