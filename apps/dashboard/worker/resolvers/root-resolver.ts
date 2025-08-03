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
import {
  createTodoResolver,
  deleteTodoResolver,
  getAllTodosResolver,
  updateTodoResolver,
} from "./todos-resolver.ts";

export const rootResolver = {
  Mutation: {
    createApplication: createApplicationResolver,
    createBookmark: createBookmarkResolver,
    createContact: createContactResolver,
    createQuestionAnswer: createQuestionAnswerResolver,
    createTodo: createTodoResolver,
    deleteApplication: deleteApplicationResolver,
    deleteBookmark: deleteBookmarkResolver,
    deleteContact: deleteContactResolver,
    deleteQuestionAnswer: deleteQuestionAnswerResolver,
    deleteTodo: deleteTodoResolver,
    updateApplication: updateApplicationResolver,
    updateBookmark: updateBookmarkResolver,
    updateContact: updateContactResolver,
    updateQuestionAnswer: updateQuestionAnswerResolver,
    updateTodo: updateTodoResolver,
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
