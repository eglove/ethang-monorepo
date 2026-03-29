import type { PropsWithChildren } from "hono/jsx";

import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import { scriptManifest } from "../../generated/script-manifest.ts";
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
  publishedAt?: string | undefined;
  textAlternate?: string;
  title?: string;
  updatedAt?: string | undefined;
}>;

export const MainLayout = async (properties: MainLayoutProperties) => {
  const title = isNil(properties.title)
    ? "EthanG"
    : `EthanG | ${properties.title}`;
  const description =
    properties.description ?? "Messing around on the web sometimes.";

  return (
    <html lang="en-US" class="dark bg-dark scroll-smooth">
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
            <link
              rel="alternate"
              title="EthanG | Blog"
              type="application/rss+xml"
              href="https://ethang.dev/blogRss.xml"
            />
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
        <link
          rel="sitemap"
          title="Sitemap"
          href="/sitemap.xml"
          type="application/xml"
        />
        {!isNil(properties.canonicalUrl) && (
          <link rel="canonical" href={properties.canonicalUrl} />
        )}
        {!isNil(properties.textAlternate) && (
          <link
            rel="alternate"
            type="text/plain"
            href={properties.textAlternate}
          />
        )}
        {!isNil(properties.updatedAt) && (
          <meta name="last-modified" content={properties.updatedAt} />
        )}
        <script
          id="script-manifest"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(scriptManifest) }}
        />
        <script defer src="/scripts/loader.js" />
      </head>
      <body id="body">
        <Navigation />
        <main class={twMerge("m-4 mt-20", properties.classNames?.main)}>
          {properties.children}
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
    navigator.serviceWorker.ready.then(function (registration) {
      var seen = Object.create(null);
      var urls = [];
      document.querySelectorAll('a[href]').forEach(function (a) {
        try {
          var url = new URL(a.href);
          if (url.origin !== location.origin) return;
          var key = url.pathname + url.search;
          if (seen[key]) return;
          seen[key] = true;
          urls.push(url.origin + key);
        } catch {}
      });
      if (urls.length > 0 && registration.active) {
        registration.active.postMessage({ type: 'PRECACHE_LINKS', urls: urls });
      }
    });
  });
  navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'CONTENT_UPDATED') {
      var updatedUrl = new URL(event.data.url);
      if (updatedUrl.pathname === location.pathname) {
        location.reload();
      }
    }
  });
}
    `,
          }}
        />
      </body>
    </html>
  );
};
