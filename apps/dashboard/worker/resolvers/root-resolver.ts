import { getAllApplicationsResolver } from "./applications-resolver.ts";
import { getAllBookmarksResolver } from "./bookmarks-resolver.ts";
import { getAllQuestionAnswersResolver } from "./question-answers-resolver.ts";

export const rootResolver = {
  Query: {
    applications: getAllApplicationsResolver,
    bookmarks: getAllBookmarksResolver,
    questionAnswers: getAllQuestionAnswersResolver,
  },
};
