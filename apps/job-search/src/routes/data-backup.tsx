import { ImportApplications } from "@/components/add-edit-application/import-applications.tsx";
import { DownloadData } from "@/components/job-tracker/download-data.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get";

const RouteComponent = () => {
  const applications = useQuery(queries.getApplications());
  const qas = useQuery(queries.getQas());

  return (
    <MainLayout>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <TypographyH3>Backup Your Data</TypographyH3>
          </CardHeader>
          <CardBody>
            <div>Applications: {get(applications, ["data", "length"], 0)}</div>
            <div>Q/A's: {get(qas, ["data", "length"], 0)}</div>
          </CardBody>
          <CardFooter className="gap-4">
            <DownloadData />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <TypographyH3>Import Data</TypographyH3>
          </CardHeader>
          <ImportApplications />
        </Card>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/data-backup")({
  component: RouteComponent,
});
