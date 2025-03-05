import { LocalImportApplications } from "@/components/add-edit-application/local-import-applications.tsx";
import { RemoteImportApplications } from "@/components/add-edit-application/remote-import-applications.tsx";
import { DownloadData } from "@/components/job-tracker/download-data.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { useUserStore } from "@/components/stores/user-store.ts";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyLead } from "@/components/typography/typography-lead.tsx";
import { getApplications } from "@/data/methods/get-applications.ts";
import { getQas } from "@/data/methods/get-qas.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get";
import isNil from "lodash/isNil";
import { DatabaseIcon } from "lucide-react";

const RouteComponent = () => {
  const applicationsQuery = useQuery(getApplications());
  const qas = useQuery(getQas());
  const store = useUserStore();

  return (
    <MainLayout classNames={{ container: "max-w-screen-md" }}>
      <Card>
        <CardHeader>
          <TypographyH3>Backup and Restore</TypographyH3>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="size-5" /> Ensure your data is backed up
              regularly.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <TypographyLead>Current Data</TypographyLead>
                <div>
                  Applications: {get(applicationsQuery, ["data", "total"], 0)}
                </div>
                <div>Q/As: {get(qas, ["data", "length"], 0)}</div>
              </div>
              <div>
                <TypographyLead>Last Synced</TypographyLead>
                {isNil(store.lastSynced)
                  ? "Never"
                  : new Date(store.lastSynced).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
              </div>
            </div>
            <DownloadData />
            <RemoteImportApplications />
            <LocalImportApplications />
          </div>
        </CardBody>
      </Card>
    </MainLayout>
  );
};

export const Route = createFileRoute("/data-backup")({
  component: RouteComponent,
});
