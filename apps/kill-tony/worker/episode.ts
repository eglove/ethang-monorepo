import type z from "zod";

import map from "lodash/map.js";

import type {
  addAppearanceSchema,
  createEpisodeSchema,
} from "../schemas/schemas.ts";
import type { getPrismaClient } from "./prisma-client.ts";

export class EpisodeService {
  private readonly _prismaClient: ReturnType<typeof getPrismaClient>;

  public constructor(primaClient: ReturnType<typeof getPrismaClient>) {
    this._prismaClient = primaClient;
  }

  public async addAppearance(data: z.output<typeof addAppearanceSchema>) {
    return this._prismaClient.episode.update({
      data: {
        appearances: {
          connectOrCreate: {
            create: data.appearance,
            where: { name: data.appearance.name },
          },
        },
      },
      where: { number: data.number },
    });
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
    return this._prismaClient.episode.findMany({
      include: { appearances: true },
      orderBy: { number: "desc" },
    });
  }

  public async getEpisodeByNumber(number: number) {
    return this._prismaClient.episode.findUnique({
      include: { appearances: true },
      where: { number },
    });
  }
}
