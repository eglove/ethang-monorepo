import { gql } from "@ethang/graphql-types/__generated__";

export const GET_SUBSCRIPTIONS_WITH_ARTICLES = gql(`
  query GetSubscriptionsWithArticles {
    subscriptions {
      edges {
        node {
          id
          title
          website
          xmlAddress
          articles(first: 50, isRead: false) {
            edges {
              node {
                id
                title
                link
                publishedAt
                isRead
              }
            }
          }
        }
      }
    }
  }
`);

export const ADD_SUBSCRIPTION = gql(`
  mutation AddSubscription($xmlAddress: String!) {
    addSubscription(xmlAddress: $xmlAddress) {
      id
      title
      website
      xmlAddress
    }
  }
`);

export const MARK_ARTICLE_READ = gql(`
  mutation MarkArticleRead($articleId: ID!, $isRead: Boolean!) {
    markArticleRead(articleId: $articleId, isRead: $isRead) {
      id
      isRead
    }
  }
`);
