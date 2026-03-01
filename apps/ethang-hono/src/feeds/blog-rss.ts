import isNil from "lodash/isNil.js";

import { BlogModel } from "../models/blog-model.ts";

export const blogRss = async () => {
  const blogModel = new BlogModel();
  const blogs = await blogModel.getAllBlogs();

  const lastBlog = blogs.at(-1);
  const lastBuildDate = isNil(lastBlog)
    ? new Date().toUTCString()
    : new Date(lastBlog._updatedAt).toUTCString();

  let content = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">

<channel>
  <title>EthanG | Blog</title>
  <link>https://ethang.dev/blog</link>
  <description>Ethan Glover's Blog</description>
  <language>en-US</language>
  <atom:link href="https://ethang.dev/blogRss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${lastBuildDate}</lastBuildDate>`;

  for (const blog of blogs) {
    content += `
  <item>
    <title>${blog.title}</title>
    <link>https://ethang.dev/blog/${blog.slug.current}</link>
    <description>${blog.description}</description>
    <pubDate>${new Date(blog._createdAt).toUTCString()}</pubDate>
    <guid isPermaLink="false">${blog._id}</guid>
   
  </item>`;
  }

  content += "\n</channel>\n</rss>";

  return content;
};
