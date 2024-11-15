import type { Dispatch, SetStateAction } from "react";

import { Input } from "@nextui-org/react";

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
        {"meetingMinutesFiles" === query
          ? "Meeting Minutes"
          : "Files"}
      </h1>
      <Input
        className="mb-4"
        color="primary"
        label="Filter"
        onValueChange={setFilter}
        size="sm"
        value={filter}
      />
    </>
  );
};
