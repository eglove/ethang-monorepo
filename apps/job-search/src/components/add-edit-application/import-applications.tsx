import type { JobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema";
import type { QuestionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema";

import { queryKeys } from "@/data/queries.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { useToggle } from "@ethang/hooks/src/use-toggle.ts";
import { Button, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import attempt from "lodash/attempt.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { CheckIcon } from "lucide-react";
import { useRef, useState } from "react";

export const ImportApplications = () => {
  const inputReference = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [isSuccessfulImport, toggleSuccessfulImport] = useToggle(false);
  const [importErrorMessage, setImportErrorMessage] = useState("");

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const [file] = inputReference.current?.files ?? [];

      if (isNil(file)) {
        return;
      }

      const text = await file.text();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const data = attempt(JSON.parse, text) as {
        applications: JobApplicationSchema[];
        qas: QuestionAnswerSchema[];
      };
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applications(),
      });

      toggleSuccessfulImport();
      globalThis.setTimeout(toggleSuccessfulImport, 1000);
    },
    onError: (error) => {
      setImportErrorMessage(error.message);
    },
  });

  return (
    <div className="mt-4 max-w-sm">
      <Input
        accept="application/json"
        name="file"
        ref={inputReference}
        type="file"
      />
      <Button
        onPress={() => {
          mutate();
        }}
        className="mt-4"
        color="primary"
        disabled={isPending}
        size="sm"
      >
        {isSuccessfulImport && <CheckIcon />}
        {!isSuccessfulImport && "Import Data"}
      </Button>
      {!isEmpty(importErrorMessage) && (
        <div className="text-danger mt-1">{importErrorMessage}</div>
      )}
    </div>
  );
};
