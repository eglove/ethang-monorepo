import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import { z } from "zod";

import { seed } from "./data-backup.js";

export const localSeed = async (request: Request, environment: Env) => {
  const promises: Promise<unknown>[] = [];
  const body = await parseFetchJson(
    request,
    z.object({
      email: z.string(),
    }),
  );

  if (isError(body)) {
    return createJsonResponse({ message: body.message }, "BAD_REQUEST");
  }

  for (const application of seed.applications) {
    promises.push(
      attemptAsync(async () =>
        environment.DB.prepare(
          `insert or replace into applications (id, applied, company, title, url,
  rejected, interviewRounds,
  userEmail)
values (?, ?, ?, ?, ?, ?, ?, ?)
`,
        )
          .bind(
            application.id,
            application.applied,
            application.company,
            application.title,
            application.url,
            application.rejected ?? null,
            application.interviewRounds,
            body.email,
          )
          .first(),
      ),
    );
  }

  for (const qa of seed.qas) {
    promises.push(
      attemptAsync(async () => {
        return environment.DB.prepare(
          `insert into questionAnswers (id, question, answer, userEmail) values (?, ?, ?, ?)`,
        )
          .bind(qa.id, qa.question, qa.answer, body.email)
          .first();
      }),
    );
  }

  const results = await Promise.all(promises);
  globalThis.console.log(results);
  return createJsonResponse({ message: "OK" }, "OK");
};
