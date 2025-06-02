import { getPrismaClient } from "../../prisma-client.ts";

export const getUserStatsData = async (environment: Env, userId: string) => {
  const prismaClient = getPrismaClient(environment);

  const [topCompanies, allUserApplications, totalApplications, totalCompanies] =
    await Promise.all([
      prismaClient.applications.groupBy({
        _count: { id: true },
        by: ["company"],
        orderBy: { _count: { id: "desc" } },
        take: 5,
        where: { userId },
      }),
      prismaClient.applications.findMany({
        orderBy: { applied: "desc" },
        select: {
          applied: true,
          interviewRounds: {
            orderBy: { dateTime: "desc" },
            select: { dateTime: true },
          },
          rejected: true,
        },
        take: 30,
        where: { userId },
      }),
      prismaClient.applications.aggregate({
        _count: { _all: true },
        where: { userId },
      }),
      prismaClient.applications.groupBy({
        by: ["company"],
        where: { userId },
      }),
    ]);

  return {
    allUserApplications,
    topCompanies,
    totalApplications,
    totalCompanies,
  };
};
