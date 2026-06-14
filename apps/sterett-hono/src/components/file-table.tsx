import map from "lodash/map.js";
import { DateTime } from "luxon";

import type { FileRecord } from "../sanity/get-files.ts";

type FileTableProperties = {
  files: FileRecord[];
  title: string;
};

export const FileTable = async ({ files, title }: FileTableProperties) => {
  return (
    <div>
      <h2 class="mb-3 text-lg font-semibold">{title}</h2>
      {0 === files.length ? (
        <p class="text-sm text-white/50">No files available.</p>
      ) : (
        <ul class="flex flex-col gap-2">
          {map(files, async (file) => {
            return (
              <li
                key={file._id}
                class="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={file.file.asset.url}
                  class="text-white/90 underline-offset-2 hover:underline"
                >
                  {file.title}
                </a>
                <span class="shrink-0 text-white/60">
                  {DateTime.fromISO(file.date.slice(0, 10)).toLocaleString({
                    dateStyle: "medium"
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
