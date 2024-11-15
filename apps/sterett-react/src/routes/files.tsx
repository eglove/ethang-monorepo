import { createRoute } from "@tanstack/react-router";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { FileTable } from "../components/files/file-table.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { rootRoute } from "../router/router.ts";
import { getGeneralCovenantFilesQueryOptions } from "../sanity/queries/get-general-covenant-files.ts";
import { getMeetingMinutesFilesQueryOptions } from "../sanity/queries/get-meeting-minutes-files.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const filesRouteQueries = {
  generalCovenantFiles: getGeneralCovenantFilesQueryOptions(),
  meetingMinutesFiles: getMeetingMinutesFilesQueryOptions(),
};

export const FilesRoute = () => {
  return (
    <MainLayout>
      <Container styleNames="grid lg:grid-cols-2 place-items-start">
        <FileTable query="generalCovenantFiles" />
        <FileTable query="meetingMinutesFiles" />
      </Container>
    </MainLayout>
  );
};

export const filesRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "Covenants and files for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Files",
    });
  },
  component: FilesRoute,
  errorComponent: EmptyContent,
  getParentRoute() {
    return rootRoute;
  },
  async loader() {
    return getRouteQueries(filesRouteQueries);
  },
  path: "/files",
});
