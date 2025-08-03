import {
  createApplicationResolver,
  deleteApplicationResolver,
  getAllApplicationsResolver,
  getApplicationsStatsResolver,
  updateApplicationResolver,
} from "./applications-resolver.ts";
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

export const rootResolver = {
  Mutation: {
    createApplication: createApplicationResolver,
    createContact: createContactResolver,
    createQuestionAnswer: createQuestionAnswerResolver,
    deleteApplication: deleteApplicationResolver,
    deleteContact: deleteContactResolver,
    deleteQuestionAnswer: deleteQuestionAnswerResolver,
    updateApplication: updateApplicationResolver,
    updateContact: updateContactResolver,
    updateQuestionAnswer: updateQuestionAnswerResolver,
  },
  Query: {
    applications: getAllApplicationsResolver,
    applicationStats: getApplicationsStatsResolver,
    contacts: getAllContactsResolver,
    questionAnswers: getAllQuestionAnswersResolver,
  },
};
