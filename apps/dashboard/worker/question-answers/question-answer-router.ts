import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createQuestionAnswer } from "./create-question-answer.ts";
import { deleteQuestionAnswer } from "./delete-question-answer.ts";
import { getAllQuestionAnswers } from "./get-all-question-answers.ts";
import { updateQuestionAnswer } from "./update-question-answer.ts";

export const questionAnswerRouter = async (
  request: Request,
  environment: Env,
) => {
  switch (request.method) {
    case "DELETE": {
      return deleteQuestionAnswer(request, environment);
    }

    case "GET": {
      return getAllQuestionAnswers(request, environment);
    }

    case "POST": {
      return createQuestionAnswer(request, environment);
    }

    case "PUT": {
      return updateQuestionAnswer(request, environment);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
