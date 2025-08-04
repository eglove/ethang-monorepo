import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { graphqlTypeDefinitionsGenerate } from "./graphql-type-definitions.ts";
import { prismaSchemaGenerate } from "./prisma-schema.ts";

export type GenerateProjectProperties = {
  importMetaUrl: string;
  includeGraphqlScalars?: string[];
  models: {
    fields: {
      isRequired?: boolean;
      name: string;
      prismaAnnotation?: string;
      type:
        | "BigInt"
        | "Boolean"
        | "Bytes"
        | "DateTime"
        | "Decimal"
        | "Float"
        | "Int"
        | "Json"
        | "String"
        | "Unsupported";
    }[];
    name: string;
    relationFields?: {
      isRequired?: boolean;
      model: string;
      name: string;
      prismaAnnotation?: string;
    }[];
  }[];
  outputDir: string;
  prismaOptions: {
    databaseEnvKey: string;
  };
};

export const generateProject = (properties: GenerateProjectProperties) => {
  const currentFileUrl = new URL(properties.importMetaUrl);
  const currentFilePath = fileURLToPath(currentFileUrl);
  const currentPath = path.dirname(currentFilePath);
  const fullPath = path.join(currentPath, properties.outputDir);

  rmSync(fullPath, { force: true, recursive: true });

  prismaSchemaGenerate(properties, fullPath);
  graphqlTypeDefinitionsGenerate(properties, fullPath);

  return true;
};
