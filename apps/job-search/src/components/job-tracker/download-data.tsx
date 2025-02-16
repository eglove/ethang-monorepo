import { queries } from "@/data/queries.ts";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";

export const DownloadData = () => {
  const applications = useQuery(queries.getApplications());
  const qas = useQuery(queries.getQas());

  const handleDownload = () => {
    if (isNil(applications.data)) {
      return;
    }

    const data = {
      applications: applications.data,
      qas: qas.data,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = "data-backup.json";
    // @ts-expect-error it's fine
    globalThis.document.body.append(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      color="primary"
      disabled={isEmpty(applications.data)}
      onPress={handleDownload}
      size="sm"
    >
      Backup Data
    </Button>
  );
};
