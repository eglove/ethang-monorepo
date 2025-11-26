import { getPrismaClient } from "../prisma-client.ts";

export const getVideos = async (environment: Env) => {
  const prisma = getPrismaClient(environment);

  return prisma.video.findMany({
    orderBy: { published: "desc" },
    where: { hasWatched: false },
  });
};
