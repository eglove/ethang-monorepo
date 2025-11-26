import startsWith from "lodash/startsWith.js";

import { getVideosUrl, updateFeedsUrl } from "../shared/api-urls.ts";
import { getVideos } from "./rss/get-videos.ts";
import { updateVideos } from "./rss/update-videos.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, updateFeedsUrl)) {
      await updateVideos(environment);

      return Response.json({ status: "OK" });
    }

    if (startsWith(url.pathname, getVideosUrl)) {
      const data = await getVideos(environment);

      return Response.json(data);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
