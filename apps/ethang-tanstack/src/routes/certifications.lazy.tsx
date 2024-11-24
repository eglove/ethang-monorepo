import { DataTable } from "@/clients/data-table.tsx";
import { CertificationDetails } from "@/components/certification/certification-details.tsx";
import { CertificationLink } from "@/components/certification/certification-link.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout";
import { LearningProfileLinks } from "../components/learning-profile/learning-profile-links";
import { certificationsQuery } from "../query/certifications";

const RouteComponent = () => {
  const { data } = useQuery(certificationsQuery());

  return (
    <MainLayout>
      <TypographyH1>
        Certifications
      </TypographyH1>
      <DataTable
        columns={[{
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
          accessorKey: "expires",
          header: "Expires",
        }, {
          cell: (info) => {
            return <CertificationDetails certification={info.row.original} />;
          },
          header: "Details",
          id: "details",
        }]}
        data={data ?? []}
      />
      <LearningProfileLinks />
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/certifications")({
  component: RouteComponent,
});
