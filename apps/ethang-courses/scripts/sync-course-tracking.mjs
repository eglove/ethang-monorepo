import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const sourceDatabase = process.env.SOURCE_D1_DATABASE ?? "ethang-hono";
const targetDatabase = process.env.TARGET_D1_DATABASE ?? "ethang-courses";
const require = createRequire(import.meta.url);
const wranglerPackagePath = require.resolve("wrangler/package.json");
const wranglerPackage = JSON.parse(readFileSync(wranglerPackagePath, "utf8"));
const wranglerBinPath = resolve(
  dirname(wranglerPackagePath),
  wranglerPackage.bin.wrangler
);

const runWranglerJson = (databaseName, sql) => {
  let output = "";

  try {
    output = execFileSync(
      process.execPath,
      [
        wranglerBinPath,
        "d1",
        "execute",
        databaseName,
        "--remote",
        "--json",
        "--command",
        sql
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
  } catch (error) {
    const message = String(error?.stdout ?? error?.message ?? error);

    if (message.includes("7930072d-1d49-4e57-a100-ac95e7916ac7")) {
      throw new Error(
        [
          "Target D1 database_id is still placeholder in apps/ethang-courses/wrangler.jsonc.",
          "Create or lookup the real database id, update wrangler.jsonc, then rerun sync.",
          "Example: pnpm --filter ethang-courses wrangler d1 list"
        ].join(" ")
      );
    }

    throw error;
  }

  return JSON.parse(output);
};

const getResults = (response) => {
  if (!Array.isArray(response) || 0 === response.length) {
    return [];
  }

  const first = response[0];

  if (null === first || "object" !== typeof first) {
    return [];
  }

  if (!Array.isArray(first.results)) {
    return [];
  }

  return first.results;
};

const escapeSqlText = (value) => {
  return String(value).replaceAll("'", "''");
};

const sourceRows = getResults(
  runWranglerJson(
    sourceDatabase,
    "SELECT id, courseUrl, status, userId FROM courseTracking;"
  )
);

if (0 === sourceRows.length) {
  console.log("No courseTracking rows found in source database.");
  process.exit(0);
}

const valuesSql = sourceRows
  .map((row) => {
    return `('${escapeSqlText(row.id)}', '${escapeSqlText(row.courseUrl)}', '${escapeSqlText(row.status)}', '${escapeSqlText(row.userId)}')`;
  })
  .join(", ");

const upsertSql = `
  INSERT INTO courseTracking (id, courseUrl, status, userId)
  VALUES ${valuesSql}
  ON CONFLICT(id)
  DO UPDATE SET
    courseUrl = excluded.courseUrl,
    status = excluded.status,
    userId = excluded.userId;
`;

runWranglerJson(targetDatabase, upsertSql);

const sourceCountRows = getResults(
  runWranglerJson(
    sourceDatabase,
    "SELECT COUNT(*) AS count FROM courseTracking;"
  )
);
const targetCountRows = getResults(
  runWranglerJson(
    targetDatabase,
    "SELECT COUNT(*) AS count FROM courseTracking;"
  )
);

const sourceCount = Number(sourceCountRows[0]?.count ?? 0);
const targetCount = Number(targetCountRows[0]?.count ?? 0);

console.log(`Synced ${sourceRows.length} rows.`);
console.log(`Source rows: ${sourceCount}`);
console.log(`Target rows: ${targetCount}`);
