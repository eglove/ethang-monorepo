import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { parseJson } from "@ethang/toolbelt/json/json.js";
import { Button, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import { queryKeys } from "@/data/queries.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { backupAllData } from "@/lib/sync-requests.ts";

export const LocalImportApplications = () => {
  const inputReference = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [importErrorMessage, setImportErrorMessage] = useState("");

  const localImport = useMutation({
    mutationFn: async () => {
      const [file] = inputReference.current?.files ?? [];

      if (isNil(file)) {
        return;
      }

      const text = await file.text();
      const data = parseJson(
        text,
        z.object({
          applications: z.array(jobApplicationSchema),
          qas: z.array(questionAnswerSchema),
        }),
      );

      if (isError(data)) {
        throw new Error("Import failed.");
      }

      const database = await getDatabase();

      const applicationTransaction = database.transaction(
        JOB_APPLICATION_STORE_NAME,
        "readwrite",
      );
      const qaTransaction = database.transaction(
        QUESTION_ANSWER_STORE_NAME,
        "readwrite",
      );

      await Promise.all([
        ...map(data.applications, async (application) => {
          return applicationTransaction.store.put(application);
        }),
        ...map(data.qas, async (qa) => {
          return qaTransaction.store.put(qa);
        }),
      ]);

      await Promise.all([applicationTransaction.done, qaTransaction.done]);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.qas(),
        }),
      ]);
      await backupAllData();
      setImportErrorMessage("");
    },
    retry: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        accept="application/json"
        label="Backup File"
        name="file"
        ref={inputReference}
        size="sm"
        type="file"
      />
      <Button
        onPress={() => {
          localImport.mutate();
        }}
        color="default"
        disabled={localImport.isPending}
        isLoading={localImport.isPending}
        startContent={<UploadIcon className="size-5" />}
      >
        Import from File
      </Button>
      {!isEmpty(importErrorMessage) && (
        <div className="mt-1 text-danger">{importErrorMessage}</div>
      )}
    </div>
  );
};
