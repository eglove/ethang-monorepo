import startsWith from "lodash/startsWith.js";

import { getPrismaClient } from "../prisma-client.ts";

export const markVideoAsWatched = async (environment: Env, id: string) => {
  const prisma = getPrismaClient(environment);

  return prisma.video.update({
    data: { hasWatched: true },
    where: {
      id: startsWith(id, "yt:video:") ? id : `yt:video:${id}`,
    },
  });
};
