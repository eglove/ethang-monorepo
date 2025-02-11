import type { JobApplication } from "@/types/job-application.ts";

import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { queryKeys } from "@/data/queries.ts";
import { getJobApplicationsDatabase } from "@/database/indexed-database.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { useRef } from "react";

export const ImportApplications = () => {
  const inputReference = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async () => {
      const [file] = inputReference.current?.files ?? [];

      if (isNil(file)) {
        return;
      }

      const text = await file.text();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const data = attempt(JSON.parse, text) as JobApplication[];
      const database = await getJobApplicationsDatabase();
      const transaction = database.transaction("jobApplications", "readwrite");

      await Promise.all(
        map(data, async (application) => {
          return transaction.store.put(application);
        }),
      );

      await transaction.done;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applications(),
      });
      await navigate({ to: "/" });
    },
  });

  return (
    <div className="max-w-md m-4 grid gap-4">
      <TypographyH2>Import Data</TypographyH2>
      <Input
        accept="application/json"
        name="file"
        ref={inputReference}
        type="file"
      />
      <div className="flex justify-end gap-4">
        <Button asChild size="sm">
          <Link to="/">Go Back</Link>
        </Button>
        <Button
          onClick={() => {
            mutate();
          }}
          size="sm"
          variant="outline"
        >
          Import
        </Button>
      </div>
    </div>
  );
};
