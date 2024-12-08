import { DataTable } from "@/clients/data-table.tsx";
import { CertificationDetails } from "@/components/certification/certification-details.tsx";
import { CertificationLink } from "@/components/certification/certification-link.tsx";
import { ContentHandler } from "@/components/common/content-handler.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { TypographyH1 } from "@ethang/react-components/src/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";

import { api } from "../../convex/_generated/api";
import { MainLayout } from "../components/layouts/main-layout";
import { LearningProfileLinks } from "../components/learning-profile/learning-profile-links";

const RouteComponent = () => {
  // @ts-expect-error beta
  const certQuery = useQuery(convexQuery(api.certifications.getAll, {}));

  return (
    <MainLayout>
      <TypographyH1>
        Certifications
      </TypographyH1>
      <ContentHandler
        isEmpty={
          () => {
            return isEmpty(certQuery.data);
          }
        }
        error={certQuery.error}
        isError={certQuery.isError}
        isLoading={certQuery.isLoading}
      >
        <DataTable
          columns={
            [{
              accessorKey: "name",
              header: "Name",
            }, {
              accessorKey: "issuedBy",

              cell: (info) => {
                return (
                  <CertificationLink url={info.row.original.url}>
                    {String(info.getValue())}
                  </CertificationLink>
                );
              },
              header: "Issued By",
            }, {
              accessorKey: "issuedOn",
              header: "Issued On",
            }, {
              accessorKey: "expiresOn",
              header: "Expires",
            }, {
              cell: (info) => {
                return <CertificationDetails certification={info.row.original} />;
              },
              header: "Details",
              id: "details",
            }]
          }
          data={get(certQuery, ["data"], [])}
        />
      </ContentHandler>
      <LearningProfileLinks />
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/certifications")({
  component: RouteComponent,
});
