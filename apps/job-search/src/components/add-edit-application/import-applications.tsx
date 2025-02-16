import { queryKeys } from "@/data/queries.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { backupAllData, getCallData } from "@/lib/sync-requests.ts";
import { useToggle } from "@ethang/hooks/src/use-toggle.ts";
import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema";
import { parseJson } from "@ethang/toolbelt/src/json/json.ts";
import { Button, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { CheckIcon } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

export const ImportApplications = () => {
  const inputReference = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [isSuccessfulImport, toggleSuccessfulImport] = useToggle(false);
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

      toggleSuccessfulImport();
      globalThis.setTimeout(toggleSuccessfulImport, 1000);
    },
    onError: (error) => {
      setImportErrorMessage(error.message);
    },
  });

  const remoteImport = useMutation({
    mutationFn: async () => {
      await getCallData();

      toggleSuccessfulImport();
      globalThis.setTimeout(toggleSuccessfulImport, 1000);
    },
    onError: (error) => {
      setImportErrorMessage(error.message);
    },
  });

  return (
    <div className="grid gap-4">
      <div>
        <Button
          onPress={() => {
            remoteImport.mutate();
          }}
          color="primary"
          disabled={localImport.isPending || remoteImport.isPending}
          isLoading={remoteImport.isPending}
          size="sm"
        >
          {isSuccessfulImport && <CheckIcon />}
          {!isSuccessfulImport && "Cloud Import"}
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <Input
          accept="application/json"
          className="max-w-sm"
          label="Backup File"
          name="file"
          ref={inputReference}
          size="sm"
          type="file"
        />
        <div>
          <Button
            onPress={() => {
              localImport.mutate();
            }}
            color="primary"
            disabled={localImport.isPending || remoteImport.isPending}
            isLoading={localImport.isPending}
            size="sm"
          >
            {isSuccessfulImport && <CheckIcon />}
            {!isSuccessfulImport && "Import from File"}
          </Button>
        </div>
        {!isEmpty(importErrorMessage) && (
          <div className="text-danger mt-1">{importErrorMessage}</div>
        )}
      </div>
    </div>
  );
};
