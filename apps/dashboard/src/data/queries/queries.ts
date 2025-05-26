export type Filters = {
  filterBy?: string;
  filterValue?: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const queryKeys = {
  allUserApplications: (userId?: string) => ["applications", userId],
  allUserQuestionAnswers: (userId?: string) => ["questionAnswers", userId],
  applications: (userId?: string, filters?: Filters) => [
    "applications",
    userId,
    filters,
  ],
  bookmarks: (userId?: string) => ["bookmarks", userId],
  questionAnswers: (userId?: string, filters?: Filters) => [
    "questionAnswers",
    userId,
    filters,
  ],
};
