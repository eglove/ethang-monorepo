import map from "lodash/map.js";
import startsWith from "lodash/startsWith.js";

import { youtubeChannels } from "../static-data/youtube-channels.ts";
import { getYouTubeFeed } from "./rss/get-you-tube-feed.ts";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/api/update-feeds")) {
      await Promise.all(
        map(youtubeChannels, async (channel) => {
          return getYouTubeFeed(channel.channelId);
        }),
      );

      return Response.json({
        name: "Cloudflare",
      });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
