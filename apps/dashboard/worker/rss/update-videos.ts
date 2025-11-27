import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { youtubeChannels } from "../../shared/youtube-channels.ts";
import { getPrismaClient } from "../prisma-client.ts";
import { getYoutubeFeed } from "./get-youtube-feed.ts";

export const updateVideos = async (environment: Env) => {
  const prisma = getPrismaClient(environment);

  Promise.all(
    map(youtubeChannels, async (channel) => {
      getYoutubeFeed(channel.channelId)
        .then(async (channelFeed) => {
          if (isNil(channelFeed)) {
            return;
          }

          const entries = get(channelFeed, ["feed", "entry"], []);

          if (!isArray(entries)) {
            return;
          }

          Promise.all(
            map(entries, async (entry) => {
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
            }),
          ).catch(globalThis.console.error);
        })
        .catch(globalThis.console.error);
    }),
  ).catch(globalThis.console.error);
};
