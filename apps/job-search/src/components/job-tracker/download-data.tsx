import { getApplications } from "@/data/methods/get-applications.ts";
import { getQas } from "@/data/methods/get-qas.ts";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import { DownloadIcon } from "lucide-react";

export const DownloadData = () => {
  const applicationsQuery = useQuery(getApplications());
  const qas = useQuery(getQas());

  const handleDownload = () => {
    if (isNil(applicationsQuery.data?.applications)) {
      return;
    }

    const data = {
      applications: applicationsQuery.data.applications,
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
      disabled={
        isEmpty(applicationsQuery.data?.applications) && isEmpty(qas.data)
      }
      color="primary"
      onPress={handleDownload}
      startContent={<DownloadIcon className="size-5" />}
    >
      Backup Data
    </Button>
  );
};
