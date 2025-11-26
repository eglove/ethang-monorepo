import isNil from "lodash/isNil.js";

import { youtubeChannels } from "../../shared/youtube-channels.ts";
import { getPrismaClient } from "../prisma-client.ts";
import { getYoutubeFeed } from "./get-youtube-feed.ts";

export const updateVideos = async (environment: Env) => {
  const prisma = getPrismaClient(environment);

  for (const channel of youtubeChannels) {
    getYoutubeFeed(channel.channelId)
      .then((channelFeed) => {
        const entries = channelFeed.feed.entry;

        for (const entry of entries) {
          console.log({ entry });
          if (isNil(entry)) {
            return;
          }

          const data = {
            authorName: entry.author.name,
            id: entry.id,
            published: entry.published,
            title: entry.title,
            updated: entry.updated,
            url: entry.link,
          };

          prisma.video
            .upsert({
              create: data,
              update: data,
              where: { id: entry.id },
            })
            .catch(globalThis.console.error);
        }
      })
      .catch(globalThis.console.error);
  }
};
