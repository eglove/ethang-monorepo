import endsWith from "lodash/endsWith.js";
import forEach from "lodash/forEach.js";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { GenerateProjectProperties } from "./index.ts";

export const prismaSchemaGenerate = (
  properties: GenerateProjectProperties,
  buildPath: string,
) => {
  let prismaSchema = `generator client {
  provider               = "prisma-client"
  output                 = "../generated/prisma"
  previewFeatures        = ["driverAdapters", "queryCompiler"]
  generatedFileExtension = "ts"
  importFileExtension    = "ts"
  moduleFormat           = "esm"
  runtime                = "cloudflare"
}

datasource db {
  provider = "sqlite"
  url      = env("${properties.prismaOptions.databaseEnvKey}")
}
`;

  for (const model of properties.models) {
    prismaSchema += `model ${model.name} {\n`;

    for (const field of model.fields) {
      prismaSchema += `${field.name} ${field.type}${true === field.isRequired ? "" : "?"} ${field.prismaAnnotation ?? ""}\n`;
    }

    // eslint-disable-next-line no-loop-func,@typescript-eslint/no-loop-func
    forEach(model.relationFields, (relationField) => {
      const isMany = endsWith(relationField.model, "[]");

      let relationString = `${relationField.name} ${relationField.model}`;

      if (!isMany && true === relationField.isRequired) {
        relationString += "?";
      }

      relationString += ` ${relationField.prismaAnnotation ?? ""}\n`;

      prismaSchema += relationString;
    });

    prismaSchema += "}\n";
  }

  const filePath = `${buildPath}/prisma/schema.prisma`;

  mkdirSync(`${buildPath}/prisma`, { recursive: true });

  writeFileSync(filePath, prismaSchema);
  execSync("pnpx prisma format", {
    cwd: path.dirname(filePath),
    stdio: "inherit",
  });
  execSync("pnpx prisma generate", {
    cwd: path.dirname(filePath),
    stdio: "inherit",
  });
};
