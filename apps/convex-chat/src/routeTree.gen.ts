/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'

// Create Virtual Routes

const FriendsLazyImport = createFileRoute('/friends')()
const ConversationsLazyImport = createFileRoute('/conversations')()
const ConversationsIdLazyImport = createFileRoute('/conversations/$id')()

// Create/Update Routes

const FriendsLazyRoute = FriendsLazyImport.update({
  id: '/friends',
  path: '/friends',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/friends.lazy').then((d) => d.Route))

const ConversationsLazyRoute = ConversationsLazyImport.update({
  id: '/conversations',
  path: '/conversations',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/conversations.lazy').then((d) => d.Route))

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ConversationsIdLazyRoute = ConversationsIdLazyImport.update({
  id: '/$id',
  path: '/$id',
  getParentRoute: () => ConversationsLazyRoute,
} as any).lazy(() =>
  import('./routes/conversations.$id.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/conversations': {
      id: '/conversations'
      path: '/conversations'
      fullPath: '/conversations'
      preLoaderRoute: typeof ConversationsLazyImport
      parentRoute: typeof rootRoute
    }
    '/friends': {
      id: '/friends'
      path: '/friends'
      fullPath: '/friends'
      preLoaderRoute: typeof FriendsLazyImport
      parentRoute: typeof rootRoute
    }
    '/conversations/$id': {
      id: '/conversations/$id'
      path: '/$id'
      fullPath: '/conversations/$id'
      preLoaderRoute: typeof ConversationsIdLazyImport
      parentRoute: typeof ConversationsLazyImport
    }
  }
}

// Create and export the route tree

interface ConversationsLazyRouteChildren {
  ConversationsIdLazyRoute: typeof ConversationsIdLazyRoute
}

const ConversationsLazyRouteChildren: ConversationsLazyRouteChildren = {
  ConversationsIdLazyRoute: ConversationsIdLazyRoute,
}

const ConversationsLazyRouteWithChildren =
  ConversationsLazyRoute._addFileChildren(ConversationsLazyRouteChildren)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/conversations': typeof ConversationsLazyRouteWithChildren
  '/friends': typeof FriendsLazyRoute
  '/conversations/$id': typeof ConversationsIdLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/conversations': typeof ConversationsLazyRouteWithChildren
  '/friends': typeof FriendsLazyRoute
  '/conversations/$id': typeof ConversationsIdLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/conversations': typeof ConversationsLazyRouteWithChildren
  '/friends': typeof FriendsLazyRoute
  '/conversations/$id': typeof ConversationsIdLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/conversations' | '/friends' | '/conversations/$id'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/conversations' | '/friends' | '/conversations/$id'
  id: '__root__' | '/' | '/conversations' | '/friends' | '/conversations/$id'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ConversationsLazyRoute: typeof ConversationsLazyRouteWithChildren
  FriendsLazyRoute: typeof FriendsLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ConversationsLazyRoute: ConversationsLazyRouteWithChildren,
  FriendsLazyRoute: FriendsLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/conversations",
        "/friends"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/conversations": {
      "filePath": "conversations.lazy.tsx",
      "children": [
        "/conversations/$id"
      ]
    },
    "/friends": {
      "filePath": "friends.lazy.tsx"
    },
    "/conversations/$id": {
      "filePath": "conversations.$id.lazy.tsx",
      "parent": "/conversations"
    }
  }
}
ROUTE_MANIFEST_END */