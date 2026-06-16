/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Course($courseId: ID!) {\n            course(id: $courseId) {\n                id\n                url\n                name\n                author\n            }\n        }": typeof types.CourseDocument,
    "query LearningPath($learningPathId: ID!) {\n            learningPath(id: $learningPathId) {\n                url\n                name\n                id\n                swebokFocus\n                courses {\n                    id\n                }\n            }\n        }": typeof types.LearningPathDocument,
    "mutation AddSubscription($xmlAddress: String!) {\n            addSubscription(xmlAddress: $xmlAddress) {\n                id\n            }\n        }": typeof types.AddSubscriptionDocument,
    "mutation MarkArticleRead($isRead: Boolean!, $articleId: ID!) {\n              markArticleRead(isRead: $isRead, articleId: $articleId) {\n                  id\n              }\n          }": typeof types.MarkArticleReadDocument,
    "query Subscriptions($first: Int, $after: String, $sortBy: SubscriptionSortInput) {\n            subscriptions(first: $first, after: $after, sortBy: $sortBy) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        title\n                    }\n                }\n            }\n        }": typeof types.SubscriptionsDocument,
    "query AllArticles($after: String, $isRead: Boolean) {\n          allArticles(after: $after, isRead: $isRead) {\n              pageInfo {\n                  hasNextPage\n                  endCursor\n              }\n              edges {\n                  node {\n                      id\n                      isRead\n                      title\n                      link\n                      publishedAt\n                  }\n              }\n          }\n      }": typeof types.AllArticlesDocument,
    "query FeedArticles($feedId: String!, $after: String, $first: Int) {\n            feedArticles(feedId: $feedId, after: $after, first: $first) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        isRead\n                        title\n                        link\n                        publishedAt\n                    }\n                }\n            }\n        }": typeof types.FeedArticlesDocument,
    "query Curriculum($curriculumId: ID!) {\n            curriculum(id: $curriculumId) {\n                id\n                updatedAt\n                learningPaths {\n                    id\n                    courses {\n                        id\n                    }\n                }\n            }\n        }": typeof types.CurriculumDocument,
};
const documents: Documents = {
    "query Course($courseId: ID!) {\n            course(id: $courseId) {\n                id\n                url\n                name\n                author\n            }\n        }": types.CourseDocument,
    "query LearningPath($learningPathId: ID!) {\n            learningPath(id: $learningPathId) {\n                url\n                name\n                id\n                swebokFocus\n                courses {\n                    id\n                }\n            }\n        }": types.LearningPathDocument,
    "mutation AddSubscription($xmlAddress: String!) {\n            addSubscription(xmlAddress: $xmlAddress) {\n                id\n            }\n        }": types.AddSubscriptionDocument,
    "mutation MarkArticleRead($isRead: Boolean!, $articleId: ID!) {\n              markArticleRead(isRead: $isRead, articleId: $articleId) {\n                  id\n              }\n          }": types.MarkArticleReadDocument,
    "query Subscriptions($first: Int, $after: String, $sortBy: SubscriptionSortInput) {\n            subscriptions(first: $first, after: $after, sortBy: $sortBy) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        title\n                    }\n                }\n            }\n        }": types.SubscriptionsDocument,
    "query AllArticles($after: String, $isRead: Boolean) {\n          allArticles(after: $after, isRead: $isRead) {\n              pageInfo {\n                  hasNextPage\n                  endCursor\n              }\n              edges {\n                  node {\n                      id\n                      isRead\n                      title\n                      link\n                      publishedAt\n                  }\n              }\n          }\n      }": types.AllArticlesDocument,
    "query FeedArticles($feedId: String!, $after: String, $first: Int) {\n            feedArticles(feedId: $feedId, after: $after, first: $first) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        isRead\n                        title\n                        link\n                        publishedAt\n                    }\n                }\n            }\n        }": types.FeedArticlesDocument,
    "query Curriculum($curriculumId: ID!) {\n            curriculum(id: $curriculumId) {\n                id\n                updatedAt\n                learningPaths {\n                    id\n                    courses {\n                        id\n                    }\n                }\n            }\n        }": types.CurriculumDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query Course($courseId: ID!) {\n            course(id: $courseId) {\n                id\n                url\n                name\n                author\n            }\n        }"): (typeof documents)["query Course($courseId: ID!) {\n            course(id: $courseId) {\n                id\n                url\n                name\n                author\n            }\n        }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query LearningPath($learningPathId: ID!) {\n            learningPath(id: $learningPathId) {\n                url\n                name\n                id\n                swebokFocus\n                courses {\n                    id\n                }\n            }\n        }"): (typeof documents)["query LearningPath($learningPathId: ID!) {\n            learningPath(id: $learningPathId) {\n                url\n                name\n                id\n                swebokFocus\n                courses {\n                    id\n                }\n            }\n        }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation AddSubscription($xmlAddress: String!) {\n            addSubscription(xmlAddress: $xmlAddress) {\n                id\n            }\n        }"): (typeof documents)["mutation AddSubscription($xmlAddress: String!) {\n            addSubscription(xmlAddress: $xmlAddress) {\n                id\n            }\n        }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation MarkArticleRead($isRead: Boolean!, $articleId: ID!) {\n              markArticleRead(isRead: $isRead, articleId: $articleId) {\n                  id\n              }\n          }"): (typeof documents)["mutation MarkArticleRead($isRead: Boolean!, $articleId: ID!) {\n              markArticleRead(isRead: $isRead, articleId: $articleId) {\n                  id\n              }\n          }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query Subscriptions($first: Int, $after: String, $sortBy: SubscriptionSortInput) {\n            subscriptions(first: $first, after: $after, sortBy: $sortBy) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        title\n                    }\n                }\n            }\n        }"): (typeof documents)["query Subscriptions($first: Int, $after: String, $sortBy: SubscriptionSortInput) {\n            subscriptions(first: $first, after: $after, sortBy: $sortBy) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        title\n                    }\n                }\n            }\n        }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query AllArticles($after: String, $isRead: Boolean) {\n          allArticles(after: $after, isRead: $isRead) {\n              pageInfo {\n                  hasNextPage\n                  endCursor\n              }\n              edges {\n                  node {\n                      id\n                      isRead\n                      title\n                      link\n                      publishedAt\n                  }\n              }\n          }\n      }"): (typeof documents)["query AllArticles($after: String, $isRead: Boolean) {\n          allArticles(after: $after, isRead: $isRead) {\n              pageInfo {\n                  hasNextPage\n                  endCursor\n              }\n              edges {\n                  node {\n                      id\n                      isRead\n                      title\n                      link\n                      publishedAt\n                  }\n              }\n          }\n      }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query FeedArticles($feedId: String!, $after: String, $first: Int) {\n            feedArticles(feedId: $feedId, after: $after, first: $first) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        isRead\n                        title\n                        link\n                        publishedAt\n                    }\n                }\n            }\n        }"): (typeof documents)["query FeedArticles($feedId: String!, $after: String, $first: Int) {\n            feedArticles(feedId: $feedId, after: $after, first: $first) {\n                pageInfo {\n                    hasNextPage\n                    endCursor\n                }\n                edges {\n                    node {\n                        id\n                        isRead\n                        title\n                        link\n                        publishedAt\n                    }\n                }\n            }\n        }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query Curriculum($curriculumId: ID!) {\n            curriculum(id: $curriculumId) {\n                id\n                updatedAt\n                learningPaths {\n                    id\n                    courses {\n                        id\n                    }\n                }\n            }\n        }"): (typeof documents)["query Curriculum($curriculumId: ID!) {\n            curriculum(id: $curriculumId) {\n                id\n                updatedAt\n                learningPaths {\n                    id\n                    courses {\n                        id\n                    }\n                }\n            }\n        }"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;