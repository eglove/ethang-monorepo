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
import {
  createContactResolver,
  deleteContactResolver,
  getAllContactsResolver,
  updateContactResolver,
} from "./contact-resolver.ts";
import {
  createQuestionAnswerResolver,
  deleteQuestionAnswerResolver,
  getAllQuestionAnswersResolver,
  updateQuestionAnswerResolver,
} from "./question-answers-resolver.ts";
import { getAllTodosResolver } from "./todos-resolver.ts";

export const rootResolver = {
  Mutation: {
    createApplication: createApplicationResolver,
    createBookmark: createBookmarkResolver,
    createContact: createContactResolver,
    createQuestionAnswer: createQuestionAnswerResolver,
    deleteApplication: deleteApplicationResolver,
    deleteBookmark: deleteBookmarkResolver,
    deleteContact: deleteContactResolver,
    deleteQuestionAnswer: deleteQuestionAnswerResolver,
    updateApplication: updateApplicationResolver,
    updateBookmark: updateBookmarkResolver,
    updateContact: updateContactResolver,
    updateQuestionAnswer: updateQuestionAnswerResolver,
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
