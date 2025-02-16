import { tokenSchema } from "@ethang/schemas/src/auth/token.js";
import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { addApplication } from "./add-application.js";
import { addQuestionAnswer } from "./add-question-answer.js";
import { deleteApplication } from "./delete-application.js";
import { deleteQuestionAnswer } from "./delete-question-answer.js";
import { getData } from "./get-data.ts";
import { syncData } from "./sync-data.js";
import { updateApplication } from "./update-application.js";
import { updateQuestionAnswer } from "./update-question-answer.js";

export default {
  // eslint-disable-next-line sonar/cognitive-complexity
  async fetch(request, environment) {
    const url = new URL(request.url);

    const urls = {
      applications: "/applications",
      questionAnswers: "/question-answers",
    };

    const unauthorizedResponse = createJsonResponse(
      { error: "Unauthorized" },
      "UNAUTHORIZED",
    );

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK");
    }

    const authorization = request.headers.get("Authorization");

    if (isNil(authorization)) {
      return unauthorizedResponse;
    }

    const verifyUrl = new URL("https://auth.ethang.dev/verify");
    verifyUrl.searchParams.set("token", authorization);
    const verifyResponse = await globalThis.fetch(verifyUrl);

    if (!verifyResponse.ok) {
      return unauthorizedResponse;
    }

    const tokenData = await parseFetchJson(verifyResponse, tokenSchema);

    if (isError(tokenData)) {
      return unauthorizedResponse;
    }

    if ("/data-sync" === url.pathname && "POST" === request.method) {
      return syncData(request, tokenData, environment);
    }

    if ("/get-data" === url.pathname && "GET" === request.method) {
      return getData(tokenData, environment);
    }

    if (urls.applications === url.pathname && "POST" === request.method) {
      return addApplication(request, tokenData, environment);
    }

    if (urls.applications === url.pathname && "PUT" === request.method) {
      return updateApplication(request, tokenData, environment);
    }

    if (urls.applications === url.pathname && "DELETE" === request.method) {
      return deleteApplication(request, tokenData, environment);
    }

    if (urls.questionAnswers === url.pathname && "POST" === request.method) {
      return addQuestionAnswer(request, tokenData, environment);
    }

    if (urls.questionAnswers === url.pathname && "PUT" === request.method) {
      return updateQuestionAnswer(request, tokenData, environment);
    }

    if (urls.questionAnswers === url.pathname && "DELETE" === request.method) {
      return deleteQuestionAnswer(request, tokenData, environment);
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND");
  },
} satisfies ExportedHandler<Env>;
