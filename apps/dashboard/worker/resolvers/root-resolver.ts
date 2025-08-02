import {
  createApplicationResolver,
  deleteApplicationResolver,
  getAllApplicationsResolver,
  getApplicationsStatsResolver,
  updateApplicationResolver,
} from "./applications-resolver.ts";
import {
  createBookmarkResolver,
  deleteBookmarkResolver,
  getAllBookmarksResolver,
  updateBookmarkResolver,
} from "./bookmarks-resolver.ts";
import { getAllContactsResolver } from "./contact-resolver.ts";
import { getAllQuestionAnswersResolver } from "./question-answers-resolver.ts";
import { getAllTodosResolver } from "./todos-resolver.ts";

export const rootResolver = {
  Mutation: {
    createApplication: createApplicationResolver,
    createBookmark: createBookmarkResolver,
    deleteApplication: deleteApplicationResolver,
    deleteBookmark: deleteBookmarkResolver,
    updateApplication: updateApplicationResolver,
    updateBookmark: updateBookmarkResolver,
  },
  Query: {
    applications: getAllApplicationsResolver,
    applicationStats: getApplicationsStatsResolver,
    bookmarks: getAllBookmarksResolver,
    contacts: getAllContactsResolver,
    questionAnswers: getAllQuestionAnswersResolver,
    todos: getAllTodosResolver,
  },
};
