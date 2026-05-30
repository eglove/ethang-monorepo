/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** An individual RSS article */
export type Article = {
  __typename?: 'Article';
  /** The HTML or text content of the article */
  content?: Maybe<Scalars['String']['output']>;
  /** The ID of the feed this article belongs to */
  feedId: Scalars['String']['output'];
  /** The globally unique identifier for the article from the RSS feed */
  guid: Scalars['String']['output'];
  /** The internal ID of the article */
  id: Scalars['ID']['output'];
  /** Whether the article has been marked as read by the user */
  isRead: Scalars['Boolean']['output'];
  /** The URL link to the original article */
  link: Scalars['String']['output'];
  /** The publication date and time of the article */
  publishedAt?: Maybe<Scalars['String']['output']>;
  /** The title of the article */
  title: Scalars['String']['output'];
};

/** A connection to a list of articles. */
export type ArticleConnection = {
  __typename?: 'ArticleConnection';
  /** A list of edges. */
  edges: Array<ArticleEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a connection. */
export type ArticleEdge = {
  __typename?: 'ArticleEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Article;
};

/** Course information */
export type Course = {
  __typename?: 'Course';
  /** The author of the course. */
  author: Scalars['String']['output'];
  /** Date when the course was created. */
  createdAt: Scalars['String']['output'];
  /** The unique identifier for the course. */
  id: Scalars['ID']['output'];
  /** The name of the course. */
  name: Scalars['String']['output'];
  /** Date when the course was last updated. */
  updatedAt: Scalars['String']['output'];
  /** The URL of the course. */
  url: Scalars['String']['output'];
};

/** A user's tracking state for a course. */
export type CourseTracking = {
  __typename?: 'CourseTracking';
  /** The canonical URL of the course. */
  courseUrl: Scalars['String']['output'];
  /** The unique identifier for the tracking record. */
  id: Scalars['ID']['output'];
  /** The current progress status for the course. */
  status: Scalars['String']['output'];
  /** The user identifier who owns this tracking record. */
  userId: Scalars['String']['output'];
};

/** A connection to a list of course tracking records. */
export type CourseTrackingConnection = {
  __typename?: 'CourseTrackingConnection';
  /** A list of edges. */
  edges: Array<CourseTrackingEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a course tracking connection. */
export type CourseTrackingEdge = {
  __typename?: 'CourseTrackingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: CourseTracking;
};

/** An RSS feed subscription */
export type Feed = {
  __typename?: 'Feed';
  /** The articles associated with this feed */
  articles: ArticleConnection;
  /** The internal ID of the feed */
  id: Scalars['ID']['output'];
  /** The date and time the feed was last fetched */
  lastFetchedAt?: Maybe<Scalars['String']['output']>;
  /** The title of the feed */
  title: Scalars['String']['output'];
  /** The website URL associated with the feed */
  website: Scalars['String']['output'];
  /** The URL of the RSS XML feed */
  xmlAddress: Scalars['String']['output'];
};


/** An RSS feed subscription */
export type FeedArticlesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A connection to a list of feeds. */
export type FeedConnection = {
  __typename?: 'FeedConnection';
  /** A list of edges. */
  edges: Array<FeedEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

/** An edge in a connection. */
export type FeedEdge = {
  __typename?: 'FeedEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Feed;
};

/** Learning path containing ordered courses */
export type LearningPath = {
  __typename?: 'LearningPath';
  /** The ordered courses in this learning path. */
  courses: Array<Course>;
  /** Date when the learning path was created. */
  createdAt: Scalars['String']['output'];
  /** The unique identifier for the learning path. */
  id: Scalars['ID']['output'];
  /** The name of the learning path. */
  name: Scalars['String']['output'];
  /** The SWEBOK focus area of the learning path. */
  swebokFocus: Scalars['String']['output'];
  /** Date when the learning path was last updated. */
  updatedAt: Scalars['String']['output'];
  /** The URL of the learning path. */
  url?: Maybe<Scalars['String']['output']>;
};

/** The root Mutation type */
export type Mutation = {
  __typename?: 'Mutation';
  /** Adds a new RSS feed subscription */
  addSubscription: Feed;
  /** Cycles a course tracking status to the next value. */
  cycleCourseTrackingStatus?: Maybe<CourseTracking>;
  /** Marks an RSS article as read or unread */
  markArticleRead: Article;
};


/** The root Mutation type */
export type MutationAddSubscriptionArgs = {
  title: Scalars['String']['input'];
  website: Scalars['String']['input'];
  xmlAddress: Scalars['String']['input'];
};


/** The root Mutation type */
export type MutationCycleCourseTrackingStatusArgs = {
  courseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** The root Mutation type */
export type MutationMarkArticleReadArgs = {
  articleId: Scalars['ID']['input'];
  isRead: Scalars['Boolean']['input'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The root Query type */
export type Query = {
  __typename?: 'Query';
  /** Returns a specific course by ID */
  course?: Maybe<Course>;
  /** Returns tracking details for a single course and user. */
  courseTracking?: Maybe<CourseTracking>;
  /** Returns tracked courses for a user with cursor pagination. */
  courseTrackings: CourseTrackingConnection;
  /** Returns all courses */
  courses: Array<Course>;
  /** Retrieves a list of articles for a specific feed */
  feedArticles: ArticleConnection;
  /** Returns a specific learning path by ID */
  learningPath?: Maybe<LearningPath>;
  /** Returns all learning paths with their courses */
  learningPaths: Array<LearningPath>;
  /** Retrieves a list of all feed subscriptions */
  subscriptions: FeedConnection;
};


/** The root Query type */
export type QueryCourseArgs = {
  id: Scalars['ID']['input'];
};


/** The root Query type */
export type QueryCourseTrackingArgs = {
  courseId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


/** The root Query type */
export type QueryCourseTrackingsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['String']['input'];
};


/** The root Query type */
export type QueryFeedArticlesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  feedId: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The root Query type */
export type QueryLearningPathArgs = {
  id: Scalars['ID']['input'];
};


/** The root Query type */
export type QuerySubscriptionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type GetCoursesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCoursesQuery = { learningPaths: Array<{ id: string, name: string, url: string | null, swebokFocus: string, courses: Array<{ id: string, name: string, url: string, author: string, updatedAt: string }> }> };
