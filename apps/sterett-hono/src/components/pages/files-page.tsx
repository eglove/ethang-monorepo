import map from "lodash/map.js";

import { getFiles } from "../../sanity/get-files.ts";
import { FileTable } from "../file-table.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

export const FilesPage = async () => {
  const { covenants, general, meetingMinutes } = await getFiles();
  const updatedAt = map(
    [...covenants, ...general, ...meetingMinutes],
    (f) => f._updatedAt,
  )
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1);

  return (
    <MainLayout
      updatedAt={updatedAt}
      title="Sterett Creek Village Trustee | Files"
      description="Covenants and files for Sterett Creek Village Trustee"
    >
      <h1 class="mb-6 text-2xl font-bold tracking-wide">Files</h1>
      <div class="grid gap-8 lg:grid-cols-2">
        <FileTable files={covenants} title="Covenants" />
        <FileTable files={general} title="General" />
        <FileTable files={meetingMinutes} title="Meeting Minutes" />
      </div>
    </MainLayout>
  );
};
