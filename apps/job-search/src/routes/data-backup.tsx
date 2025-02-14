import { DownloadData } from "@/components/job-tracker/download-data.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { queries } from "@/data/queries.ts";
import { Button, Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

const RouteComponent = () => {
  const query = useQuery(queries.getApplications());

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <TypographyH3>Backup / Import Your Data</TypographyH3>
        </CardHeader>
        <CardBody>
          <div>Applications: {query.data?.length}</div>
        </CardBody>
        <CardFooter className="gap-4">
          <DownloadData />
          <Button as={Link} color="primary" size="sm" to="/import-data">
            Import Data
          </Button>
        </CardFooter>
      </Card>
    </MainLayout>
  );
};

export const Route = createFileRoute("/data-backup")({
  component: RouteComponent,
});
