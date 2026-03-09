import forEach from "lodash/forEach.js";
import { DateTime } from "luxon";

import { rootUrl, routes } from "../routes.ts";
import { BlogModel } from "./models/blog-model.ts";

export const sitemap = async () => {
  const today = DateTime.now().toFormat("yyyy-MM-dd");
  const blogModel = new BlogModel();
  const blogs = await blogModel.getAllBlogs();

  let sitemapString = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  forEach(routes, (route) => {
    const url = new URL(route, rootUrl);

    sitemapString += `<url>
  <loc>${url.href}</loc>
  <lastmod>${today}</lastmod>
</url>\n`;
  });

  forEach(blogs, (blog) => {
    const url = new URL(`/blog/${blog.slug.current}`, rootUrl);
    const updatedAt = DateTime.fromISO(blog._updatedAt).toFormat("yyyy-MM-dd");

    sitemapString += `<url>
      <loc>${url.href}</loc>
      <lastmod>${updatedAt}</lastmod>
    </url>\n`;
  });

  sitemapString += `</urlset>`;

  return sitemapString;
};
