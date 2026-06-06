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
    "query Course($courseId: ID!) {\n  course(id: $courseId) {\n    id\n    name\n    url\n    author\n  }\n}": typeof types.CourseDocument,
    "query LearningPath($learningPathId: ID!) {\n  learningPath(id: $learningPathId) {\n    id\n    swebokFocus\n    name\n    url\n    courses {\n      id\n    }\n  }\n}": typeof types.LearningPathDocument,
    "query GetRecommendedCoursesLearningPathIds {\n  curriculum(id: \"019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4\") {\n    id\n    name\n    updatedAt\n    learningPaths {\n      id\n        courses {\n            id\n        }\n    }\n  }\n}": typeof types.GetRecommendedCoursesLearningPathIdsDocument,
};
const documents: Documents = {
    "query Course($courseId: ID!) {\n  course(id: $courseId) {\n    id\n    name\n    url\n    author\n  }\n}": types.CourseDocument,
    "query LearningPath($learningPathId: ID!) {\n  learningPath(id: $learningPathId) {\n    id\n    swebokFocus\n    name\n    url\n    courses {\n      id\n    }\n  }\n}": types.LearningPathDocument,
    "query GetRecommendedCoursesLearningPathIds {\n  curriculum(id: \"019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4\") {\n    id\n    name\n    updatedAt\n    learningPaths {\n      id\n        courses {\n            id\n        }\n    }\n  }\n}": types.GetRecommendedCoursesLearningPathIdsDocument,
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
export function gql(source: "query Course($courseId: ID!) {\n  course(id: $courseId) {\n    id\n    name\n    url\n    author\n  }\n}"): (typeof documents)["query Course($courseId: ID!) {\n  course(id: $courseId) {\n    id\n    name\n    url\n    author\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query LearningPath($learningPathId: ID!) {\n  learningPath(id: $learningPathId) {\n    id\n    swebokFocus\n    name\n    url\n    courses {\n      id\n    }\n  }\n}"): (typeof documents)["query LearningPath($learningPathId: ID!) {\n  learningPath(id: $learningPathId) {\n    id\n    swebokFocus\n    name\n    url\n    courses {\n      id\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetRecommendedCoursesLearningPathIds {\n  curriculum(id: \"019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4\") {\n    id\n    name\n    updatedAt\n    learningPaths {\n      id\n        courses {\n            id\n        }\n    }\n  }\n}"): (typeof documents)["query GetRecommendedCoursesLearningPathIds {\n  curriculum(id: \"019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4\") {\n    id\n    name\n    updatedAt\n    learningPaths {\n      id\n        courses {\n            id\n        }\n    }\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;