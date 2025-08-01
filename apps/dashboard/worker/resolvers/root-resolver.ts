import {
  getAllApplicationsResolver,
  getApplicationsStatsResolver,
} from "./applications-resolver.ts";
import { getAllBookmarksResolver } from "./bookmarks-resolver.ts";
import { getAllContactsResolver } from "./contact-resolver.ts";
import { getAllQuestionAnswersResolver } from "./question-answers-resolver.ts";
import { getAllTodosResolver } from "./todos-resolver.ts";

export const rootResolver = {
  Query: {
    applications: getAllApplicationsResolver,
    applicationStats: getApplicationsStatsResolver,
    bookmarks: getAllBookmarksResolver,
    contacts: getAllContactsResolver,
    questionAnswers: getAllQuestionAnswersResolver,
    todos: getAllTodosResolver,
  },
};
