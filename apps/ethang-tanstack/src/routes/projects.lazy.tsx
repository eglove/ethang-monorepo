import { DataTable } from "@/clients/data-table.tsx";
import { ProjectDetails } from "@/components/project/project-details.tsx";
import { ProjectLink } from "@/components/project/project-link.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout";
import { projectsQuery } from "../query/projects";

const RouteComponent = () => {
  const { data } = useQuery(projectsQuery());

  return (
    <MainLayout>
      <TypographyH1>
        Projects
      </TypographyH1>
      <DataTable
        columns={[{
          accessorKey: "name",

          cell: (info) => {
            return (
              <ProjectLink
                url={info.row.original.url}
              >
                {String(info.getValue())}
              </ProjectLink>
            );
          },
          header: "Name",
        }, {

          cell: (info) => {
            return <ProjectDetails project={info.row.original} />;
          },
          header: "Details",
          id: "details",
        }]}
        data={data ?? []}
      />
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/projects")({
  component: RouteComponent,
});
