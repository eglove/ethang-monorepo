import { ImportApplications } from "@/components/add-edit-application/import-applications.tsx";
import { DataSync } from "@/components/data-backup/data-sync.tsx";
import { DownloadData } from "@/components/job-tracker/download-data.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyH4 } from "@/components/typography/typography-h4.tsx";
import { TypographyList } from "@/components/typography/typography-list.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get";

const RouteComponent = () => {
  const applications = useQuery(queries.getApplications());
  const qas = useQuery(queries.getQas());

  return (
    <MainLayout>
      <div className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <TypographyH3>Backup and Restore</TypographyH3>
            </CardHeader>
            <CardBody>
              <div>
                Applications: {get(applications, ["data", "length"], 0)}
              </div>
              <div>Q/A's: {get(qas, ["data", "length"], 0)}</div>
              <div className="mt-4">
                <DownloadData />
              </div>
              <ImportApplications />
            </CardBody>
          </Card>
          <DataSync />
        </div>
        <Card>
          <CardHeader>
            <TypographyH3>Understanding Data Backup</TypographyH3>
          </CardHeader>
          <CardBody>
            <TypographyH4 className="mb-4">How do use this page:</TypographyH4>
            <TypographyList className="mt-0">
              <li>
                Use the "Download Data" button to save a copy of your data.
              </li>
              <li>
                Use the file input to restore a previously downloaded backup.
              </li>
              <li>Use the switch to start or stop syncing your data.</li>
            </TypographyList>
            <TypographyH4>What is local-first?</TypographyH4>
            <TypographyP>
              Local-first means your data is primarily stored on your device.
              This gives you faster access and more control over your
              information. Whether you sync this data to the cloud is entirely
              up to you. By not doing so, you assume the risk of losing it.
            </TypographyP>
            <TypographyH4 className="mt-4">Why backup?</TypographyH4>
            <TypographyP>
              Backing up your data means we save your data as a backup, the same
              as if you were do download it. This means you can access your data
              from different devices and ensures you don't lose information if
              something happens to your local device.
            </TypographyP>
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/data-backup")({
  component: RouteComponent,
});
