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

const urls = {
  applications: "/applications",
  questionAnswers: "/question-answers",
};

const unauthorizedResponse = (request: Request) =>
  createJsonResponse(
    { error: "Unauthorized" },
    "UNAUTHORIZED",
    undefined,
    request,
  );

export default {
  // eslint-disable-next-line sonar/cognitive-complexity
  async fetch(request, environment) {
    const url = new URL(request.url);

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK", undefined, request);
    }

    const authorization = request.headers.get("Authorization");

    if (isNil(authorization)) {
      return unauthorizedResponse(request);
    }

    const verifyUrl = new URL("https://auth.ethang.dev/verify");
    verifyUrl.searchParams.set("token", authorization);
    const verifyResponse = await globalThis.fetch(verifyUrl);

    if (!verifyResponse.ok) {
      return unauthorizedResponse(request);
    }

    const tokenData = await parseFetchJson(verifyResponse, tokenSchema);

    if (isError(tokenData)) {
      return unauthorizedResponse(request);
    }

    if ("/data-sync" === url.pathname && "POST" === request.method) {
      return syncData(request, tokenData, environment);
    }

    if ("/get-data" === url.pathname && "GET" === request.method) {
      return getData(request, tokenData, environment);
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

    return createJsonResponse(
      { error: "Not Found" },
      "NOT_FOUND",
      undefined,
      request,
    );
  },
} satisfies ExportedHandler<Env>;
