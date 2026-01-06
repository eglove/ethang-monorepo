import { getPrismaClient } from "../prisma-client.ts";

export const temporary = async (environment: Env) => {
  const prisma = getPrismaClient(environment);

  const result = await prisma.knowledgeArea.update({
    data: {
      courses: {
        connect: [{ id: "019b9501-a85b-72dd-86f2-2047713f05c2" }],
      },
    },
    include: { courses: true },
    where: { id: "019b8bb5-3162-71c8-a4d4-18ec7a9769cd" },
  });
  globalThis.console.log(result);
  return [];
};
