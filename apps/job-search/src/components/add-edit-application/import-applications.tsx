import { queryKeys } from "@/data/queries.ts";
import {
  getJobApplicationsDatabase,
  getQuestionAnswerDatabase,
  JOB_APPLICATION_STORE_NAME,
  type JobApplicationSchema,
  QUESTION_ANSWER_STORE_NAME,
  type QuestionAnswerSchema,
} from "@/database/indexed-database.ts";
import { Button, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
      const data = attempt(JSON.parse, text) as {
        applications: JobApplicationSchema[];
        qas: QuestionAnswerSchema[];
      };
      const applicationDatabase = await getJobApplicationsDatabase();
      const qaDatabase = await getQuestionAnswerDatabase();
      const applicationTransaction = applicationDatabase.transaction(
        JOB_APPLICATION_STORE_NAME,
        "readwrite",
      );
      const qaTransaction = qaDatabase.transaction(
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
      await navigate({ to: "/" });
    },
  });

  return (
    <div className="max-w-sm m-4 grid gap-4">
      <Input
        accept="application/json"
        name="file"
        ref={inputReference}
        type="file"
      />
      <div className="flex justify-end gap-4">
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
