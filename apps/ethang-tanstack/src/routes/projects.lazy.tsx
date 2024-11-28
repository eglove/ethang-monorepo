import { DataTable } from "@/clients/data-table.tsx";
import { ContentHandler } from "@/components/common/content-handler.tsx";
import { ProjectDetails } from "@/components/project/project-details.tsx";
import { ProjectLink } from "@/components/project/project-link.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isArray from "lodash/isArray.js";

import { api } from "../../convex/_generated/api";
import { MainLayout } from "../components/layouts/main-layout";

const RouteComponent = () => {
  // @ts-expect-error beta
  const query = useQuery(convexQuery(api.project.getAll, {}));

  return (
    <MainLayout>
      <TypographyH1>
        Projects
      </TypographyH1>
      <ContentHandler
        error={query.error}
        isError={query.isError}
        isLoading={query.isPending}
      >
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
          data={isArray(query.data)
            ? query.data
            : []}
        />
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/projects")({
  component: RouteComponent,
});
