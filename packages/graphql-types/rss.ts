export type AddSubscriptionMutation = { addSubscription: { id: string } };
export type AddSubscriptionMutationVariables = Exact<{
  xmlAddress: string;
}>;
export type AllArticlesQuery = {
  allArticles: {
    edges: {
      node: {
        feed: { id: string; title: string };
        id: string;
        isRead: boolean;
        link: string;
        publishedAt: null | string;
        title: string;
      };
    }[];
    pageInfo: { endCursor: null | string; hasNextPage: boolean };
  };
};

export type AllArticlesQueryVariables = Exact<{
  after?: null | string | undefined;
  isRead?: boolean | null | undefined;
}>;

export type CourseQuery = {
  course: { author: string; id: string; name: string; url: string } | null;
};

export type CourseQueryVariables = Exact<{
  courseId: number | string;
}>;

export type CurriculumQuery = {
  curriculum: {
    id: string;
    learningPaths: { courses: { id: string }[]; id: string }[];
    updatedAt: string;
  } | null;
};

export type CurriculumQueryVariables = Exact<{
  curriculumId: number | string;
}>;

export type FeedArticlesQuery = {
  feedArticles: {
    edges: {
      node: {
        feed: { id: string; title: string };
        id: string;
        isRead: boolean;
        link: string;
        publishedAt: null | string;
        title: string;
      };
    }[];
    pageInfo: { endCursor: null | string; hasNextPage: boolean };
  };
};

export type FeedArticlesQueryVariables = Exact<{
  after?: null | string | undefined;
  feedId: string;
  first?: null | number | undefined;
}>;

/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | {
      [P in keyof T]?: P extends "__typename" | " $fragmentName" ? T[P] : never;
    }
  | T;

export type LearningPathQuery = {
  learningPath: {
    courses: { id: string }[];
    id: string;
    name: string;
    swebokFocus: string;
    url: null | string;
  } | null;
};

export type LearningPathQueryVariables = Exact<{
  learningPathId: number | string;
}>;

export type MarkArticleReadMutation = { markArticleRead: { id: string } };

export type MarkArticleReadMutationVariables = Exact<{
  articleId: number | string;
  isRead: boolean;
}>;

/** The direction to sort. */
export type SortDirection =
  /** Sort in ascending order. */
  | "ASC"
  /** Sort in descending order. */
  | "DESC";

/** The field to sort subscriptions by. */
export type SubscriptionSortField =
  /** Sort by the publication date of the most recent article. */
  | "PUBLISHED_AT"
  /** Sort by the title of the subscription. */
  | "TITLE";

/** Input for sorting subscriptions. */
export type SubscriptionSortInput = {
  /** The direction to sort the subscriptions. */
  direction: SortDirection;
  /** The field to sort the subscriptions by. */
  field: SubscriptionSortField;
};

export type SubscriptionsQuery = {
  subscriptions: {
    edges: { node: { id: string; title: string } }[];
    pageInfo: { endCursor: null | string; hasNextPage: boolean };
  };
};

export type SubscriptionsQueryVariables = Exact<{
  after?: null | string | undefined;
  first?: null | number | undefined;
  sortBy?: null | SubscriptionSortInput | undefined;
}>;

/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends Record<string, unknown>> = { [K in keyof T]: T[K] };
