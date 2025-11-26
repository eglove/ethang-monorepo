import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

import {
  getVideosUrl,
  markVideoAsSeenUrl,
  updateFeedsUrl,
} from "../shared/api-urls.ts";
import { getVideos } from "./rss/get-videos.ts";
import { markVideoAsWatched } from "./rss/mark-video-as-watched.ts";
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

    if (startsWith(url.pathname, markVideoAsSeenUrl)) {
      const id = url.searchParams.get("id");

      if (isNil(id)) {
        return new Response(null, { status: 400 });
      }

      const data = await markVideoAsWatched(environment, id);
      return Response.json(data);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
