import type z from "zod";

import map from "lodash/map.js";

import type { createEpisodeSchema } from "../schemas/episode-schema.ts";
import type { getPrismaClient } from "./prisma-client.ts";

export class EpisodeService {
  private readonly _prismaClient: ReturnType<typeof getPrismaClient>;

  public constructor(primaClient: ReturnType<typeof getPrismaClient>) {
    this._prismaClient = primaClient;
  }

  public async createEpisode(episode: z.output<typeof createEpisodeSchema>) {
    return this._prismaClient.episode.create({
      data: {
        ...episode,
        appearances: {
          connectOrCreate: map(episode.appearances, (appearance) => {
            return {
              create: { ...appearance },
              where: { name: appearance.name },
            };
          }),
        },
      },
      include: { appearances: true },
    });
  }

  public async getAll() {
    return this._prismaClient.episode.findMany({ orderBy: { number: "desc" } });
  }
}
