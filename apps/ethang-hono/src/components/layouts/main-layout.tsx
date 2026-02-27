import type { PropsWithChildren } from "hono/jsx";

import "flowbite";
import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import { Navigation } from "../navigation/navigation.tsx";

export type MainLayoutProperties = PropsWithChildren<{
  author?: string;
  canonicalUrl?: string;
  classNames?: {
    main?: string;
  };
  description?: string;
  imageUrl?: string;
  isBlog?: boolean;
  publishedAt: string;
  title?: string;
  updatedAt: string;
}>;

export const MainLayout = async (properties: MainLayoutProperties) => {
  const title = isNil(properties.title)
    ? "EthanG"
    : `EthanG | ${properties.title}`;
  const description =
    properties.description ?? "Messing around on the web sometimes.";

  return (
    <html lang="en-US" class="dark bg-dark">
      <head>
        <title>{title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:type"
          content={true === properties.isBlog ? "article" : "website"}
        />
        {true === properties.isBlog && (
          <>
            <meta
              content={properties.publishedAt}
              property="article:published_time"
            />
            <meta
              content={properties.updatedAt}
              property="article:modified_time"
            />
          </>
        )}

        <meta name="description" content={description} />
        <meta name="og:type" content="website" />
        <meta content={title} name="og:title" />
        <meta name="author" content={properties.author ?? "Ethan Glover"} />
        <meta content={description} name="og:description" />
        <meta name="image" property="og:image" content={properties.imageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta content={title} name="twitter:title" />
        <meta content={description} name="twitter:description" />
        <meta name="twitter:image" content={properties.imageUrl} />

        <link rel="stylesheet" href="/index.css" />
        {!isNil(properties.canonicalUrl) && (
          <link rel="canonical" href={properties.canonicalUrl} />
        )}
      </head>
      <body>
        <Navigation />
        <main class={twMerge("m-4 mt-20", properties.classNames?.main)}>
          {properties.children}
        </main>
        <script src="/scripts/flowbite/flowbite.min.js"></script>
      </body>
    </html>
  );
};
