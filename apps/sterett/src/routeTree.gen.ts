/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()
const AdminEventIndexLazyImport = createFileRoute('/admin/event/')()
const AdminEventCreateLazyImport = createFileRoute('/admin/event/create')()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const AdminEventIndexLazyRoute = AdminEventIndexLazyImport.update({
  id: '/admin/event/',
  path: '/admin/event/',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/admin/event/index.lazy').then((d) => d.Route),
)

const AdminEventCreateLazyRoute = AdminEventCreateLazyImport.update({
  id: '/admin/event/create',
  path: '/admin/event/create',
  getParentRoute: () => rootRoute,
} as any).lazy(() =>
  import('./routes/admin/event/create.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/admin/event/create': {
      id: '/admin/event/create'
      path: '/admin/event/create'
      fullPath: '/admin/event/create'
      preLoaderRoute: typeof AdminEventCreateLazyImport
      parentRoute: typeof rootRoute
    }
    '/admin/event/': {
      id: '/admin/event/'
      path: '/admin/event'
      fullPath: '/admin/event'
      preLoaderRoute: typeof AdminEventIndexLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/admin/event/create': typeof AdminEventCreateLazyRoute
  '/admin/event': typeof AdminEventIndexLazyRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/admin/event/create': typeof AdminEventCreateLazyRoute
  '/admin/event': typeof AdminEventIndexLazyRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/admin/event/create': typeof AdminEventCreateLazyRoute
  '/admin/event/': typeof AdminEventIndexLazyRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/admin/event/create' | '/admin/event'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/admin/event/create' | '/admin/event'
  id: '__root__' | '/' | '/admin/event/create' | '/admin/event/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  AdminEventCreateLazyRoute: typeof AdminEventCreateLazyRoute
  AdminEventIndexLazyRoute: typeof AdminEventIndexLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  AdminEventCreateLazyRoute: AdminEventCreateLazyRoute,
  AdminEventIndexLazyRoute: AdminEventIndexLazyRoute,
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
        "/admin/event/create",
        "/admin/event/"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/admin/event/create": {
      "filePath": "admin/event/create.lazy.tsx"
    },
    "/admin/event/": {
      "filePath": "admin/event/index.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */