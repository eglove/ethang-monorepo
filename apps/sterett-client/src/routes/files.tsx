import { createFileRoute } from "@tanstack/react-router";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { FileTable } from "../components/files/file-table.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getGeneralCovenantFilesQueryOptions } from "../sanity/queries/get-general-covenant-files.ts";
import { getMeetingMinutesFilesQueryOptions } from "../sanity/queries/get-meeting-minutes-files.ts";
import { getRouteQueries } from "../utilities/get-route-queries.ts";
import { setMeta } from "../utilities/set-meta.ts";

export const filesRouteQueries = {
  generalCovenantFiles: getGeneralCovenantFilesQueryOptions(),
  meetingMinutesFiles: getMeetingMinutesFilesQueryOptions(),
};

const RouteComponent = () => {
  return (
    <MainLayout>
      <Container styleNames="grid lg:grid-cols-2 place-items-start">
        <FileTable query="generalCovenantFiles" />
        <FileTable query="meetingMinutesFiles" />
      </Container>
    </MainLayout>
  );
};

export const Route = createFileRoute("/files")({
  beforeLoad() {
    setMeta({
      description: "Covenants and files for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Files",
    });
  },
  component: RouteComponent,
  errorComponent: EmptyContent,
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(filesRouteQueries);
  },
});
