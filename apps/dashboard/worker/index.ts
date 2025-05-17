import startsWith from "lodash/startsWith";

import { bookmarkRouter } from "./bookmarks/bookmark-router.ts";
import { paths } from "./paths.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, paths.bookmark)) {
      return bookmarkRouter(request, environment);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
