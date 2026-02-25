import type { PropsWithChildren } from "hono/jsx";

import isNil from "lodash/isNil.js";
import "flowbite";

import { Navigation } from "../navigation/navigation.tsx";

type MainLayoutProperties = PropsWithChildren<{
  description?: string;
  imageUrl?: string;
  pathname: string;
  title?: string;
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

        <meta name="description" content={description} />
        <meta name="og:type" content="website" />
        <meta content={title} name="og:title" />
        <meta content={description} name="og:description" />
        <meta name="og:image" content={properties.imageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta content={title} name="twitter:title" />
        <meta content={description} name="twitter:description" />
        <meta name="twitter:image" content={properties.imageUrl} />

        <link rel="stylesheet" href="/index.css" />
      </head>
      <body>
        <Navigation pathname={properties.pathname} />
        <main class="m-4">{properties.children}</main>
        <script src="https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.js"></script>
      </body>
    </html>
  );
};
