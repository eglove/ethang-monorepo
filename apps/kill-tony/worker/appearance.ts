import type z from "zod";

import type { createAppearanceSchema } from "../schemas/schemas.ts";
import type { getPrismaClient } from "./prisma-client.ts";

export class AppearanceService {
  private readonly _prismaClient: ReturnType<typeof getPrismaClient>;

  public constructor(primaClient: ReturnType<typeof getPrismaClient>) {
    this._prismaClient = primaClient;
  }

  public async createAppearance(data: z.output<typeof createAppearanceSchema>) {
    return this._prismaClient.appearance.create({ data });
  }

  public async getAll() {
    return this._prismaClient.appearance.findMany();
  }

  public async getByName(name: string) {
    return this._prismaClient.appearance.findUnique({
      include: { episodes: true },
      where: { name },
    });
  }
}
