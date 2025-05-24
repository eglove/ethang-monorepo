import { PrismaD1HTTP } from "@prisma/adapter-d1";
import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

type LocalEnvironment = {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_D1_TOKEN: string;
  CLOUDFLARE_DATABASE_ID: string;
};

export default defineConfig({
  earlyAccess: true,
  migrate: {
    // eslint-disable-next-line @typescript-eslint/require-await
    async adapter(environment: LocalEnvironment) {
      return new PrismaD1HTTP({
        CLOUDFLARE_ACCOUNT_ID: environment.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_D1_TOKEN: environment.CLOUDFLARE_D1_TOKEN,
        CLOUDFLARE_DATABASE_ID: environment.CLOUDFLARE_DATABASE_ID,
      });
    },
  },
  schema: path.join("prisma", "schema.prisma"),
});
