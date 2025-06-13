import startsWith from "lodash/startsWith.js";

import { getAllNews } from "./projects/get-all-news.ts";
import { getAllProjects } from "./projects/get-all-projects.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/api/project")) {
      return getAllProjects(request, environment);
    }

    if (startsWith(url.pathname, "/api/news")) {
      return getAllNews(request, environment);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
