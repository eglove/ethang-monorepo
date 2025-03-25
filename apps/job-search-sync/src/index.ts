import { tokenSchema } from "@ethang/schemas/src/auth/token.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { addApplication } from "./add-application.js";
import { addQuestionAnswer } from "./add-question-answer.js";
import { deleteApplication } from "./delete-application.js";
import { deleteQuestionAnswer } from "./delete-question-answer.js";
import { deleteUserData } from "./delete-user-data.js";
import { getApplications } from "./get-applications.js";
import { getData } from "./get-data.ts";
import { getQas } from "./get-qas.js";
import { globalStats } from "./global-stats.js";
import { syncData } from "./sync-data.js";
import { updateApplication } from "./update-application.js";
import { updateQuestionAnswer } from "./update-question-answer.js";
import { userStats } from "./user-stats.js";

export default {
  // eslint-disable-next-line sonar/cognitive-complexity
  async fetch(request, environment) {
    const url = new URL(request.url);

    const urls = {
      applications: "/applications",
      clearUserData: "/user-data",
      globalStats: "/global-stats",
      questionAnswers: "/question-answers",
      userStats: "/user-stats",
    };

    const unauthorizedResponse = createJsonResponse(
      { error: "Unauthorized" },
      "UNAUTHORIZED",
    );

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK");
    }

    if (urls.globalStats === url.pathname && "GET" === request.method) {
      return globalStats(environment);
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

    if (urls.applications === url.pathname && "GET" === request.method) {
      return getApplications(request, tokenData, environment);
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

    if (urls.questionAnswers === url.pathname && "GET" === request.method) {
      return getQas(tokenData, environment);
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

    if (urls.userStats === url.pathname && "GET" === request.method) {
      return userStats(tokenData, environment);
    }

    if (urls.clearUserData === url.pathname && "DELETE" === request.method) {
      return deleteUserData(request, tokenData, environment);
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND");
  },
} satisfies ExportedHandler<Env>;
