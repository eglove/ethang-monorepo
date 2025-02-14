import type { JobApplication } from "@/types/job-application.ts";

import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { queryKeys } from "@/data/queries.ts";
import {
  getJobApplicationsDatabase,
  JOB_APPLICATION_STORE_NAME,
} from "@/database/indexed-database.ts";
import { Button, Input } from "@heroui/react";
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
      const transaction = database.transaction(
        JOB_APPLICATION_STORE_NAME,
        "readwrite",
      );

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
        <Button as={Link} color="primary" size="sm" to="/">
          Go Back
        </Button>
        <Button
          onPress={() => {
            mutate();
          }}
          color="primary"
          size="sm"
        >
          Import
        </Button>
      </div>
    </div>
  );
};
