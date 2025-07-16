import map from "lodash/map.js";
import z from "zod";

import type { getPrismaClient } from "./prisma-client.ts";

export const createEpisodeSchema = z.object({
  appearances: z.array(
    z.object({
      imageUrl: z.string(),
      isGoldenTicketWinner: z.boolean(),
      isHallOfFame: z.boolean(),
      name: z.string(),
      type: z.string(),
    }),
  ),
  number: z.number(),
  publishDate: z.date(),
  title: z.string(),
  url: z.url(),
});

export class EpisodeService {
  private readonly _prismaClient: ReturnType<typeof getPrismaClient>;

  public constructor(primaClient: ReturnType<typeof getPrismaClient>) {
    this._prismaClient = primaClient;
  }

  public async createEpisode(episode: z.output<typeof createEpisodeSchema>) {
    return this._prismaClient.episode.create({
      data: {
        appearances: {
          connectOrCreate: map(episode.appearances, (appearance) => {
            return {
              create: { ...appearance },
              where: { name: appearance.name },
            };
          }),
        },
        number: episode.number,
        publishDate: episode.publishDate,
        title: episode.title,
        url: episode.url,
      },
      include: { appearances: true },
    });
  }
}
