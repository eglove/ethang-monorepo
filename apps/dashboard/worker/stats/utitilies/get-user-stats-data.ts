import { getPrismaClient } from "../../prisma-client.ts";

export const getUserStatsData = async (environment: Env, userId: string) => {
  const prismaClient = getPrismaClient(environment);

  const [topCompanies, allUserApplications, totalCompaniesAndApplications] =
    await Promise.all([
      prismaClient.applications.groupBy({
        _count: { id: true },
        by: ["company"],
        orderBy: { _count: { id: "desc" } },
        take: 5,
        where: { userId },
      }),
      prismaClient.applications.findMany({
        orderBy: { applied: "asc" },
        select: {
          applied: true,
          interviewRounds: {
            orderBy: { dateTime: "asc" },
            select: { dateTime: true },
          },
          rejected: true,
        },
        where: { userId },
      }),
      prismaClient.applications.aggregate({
        _count: { _all: true, company: true },
        where: { userId },
      }),
    ]);

  return {
    allUserApplications,
    topCompanies,
    totalCompaniesAndApplications,
  };
};
