import { queries } from "@/data/queries.ts";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";

export const DownloadData = () => {
  const query = useQuery(queries.getApplications());

  const handleDownload = () => {
    if (isNil(query.data)) {
      return;
    }

    const blob = new Blob([JSON.stringify(query.data, null, 2)], {
      type: "application/json",
    });
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = "job-applications.json";
    // @ts-expect-error it's fine
    globalThis.document.body.append(link);
    link.click();

    link.remove();
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      color="primary"
      disabled={isEmpty(query.data)}
      onPress={handleDownload}
      size="sm"
    >
      Download Data
    </Button>
  );
};
