import endsWith from "lodash/endsWith.js";
import forEach from "lodash/forEach.js";
import replace from "lodash/replace.js";
import { mkdirSync, writeFileSync } from "node:fs";

import type { GenerateProjectProperties } from "./index.ts";

export const graphqlTypeDefinitionsGenerate = (
  properties: GenerateProjectProperties,
  buildPath: string,
) => {
  let typeDefinitionsFile = "export const typeDefs = `#graphql\n";

  forEach(properties.includeGraphqlScalars, (scalar) => {
    typeDefinitionsFile += `scalar ${scalar}\n`;
  });

  forEach(properties.models, (model) => {
    typeDefinitionsFile += `\ntype ${model.name} {\n`;

    forEach(model.fields, (field) => {
      const typeString = "DateTime" === field.type ? "Date" : field.type;
      typeDefinitionsFile += `\t${field.name}: ${typeString}${true === field.isRequired ? "!" : ""}\n`;
    });

    forEach(model.relationFields, (relationField) => {
      const isMany = endsWith(relationField.model, "[]");
      const singleString = `\t${relationField.name}: ${relationField.model}${true === relationField.isRequired ? "!" : ""}\n`;
      const manyString = `\t${relationField.name}: [${replace(relationField.model, "[]", "")}]!\n`;

      typeDefinitionsFile += isMany ? manyString : singleString;
    });

    typeDefinitionsFile += "}\n";
  });

  typeDefinitionsFile += `\`;\n`;

  const filePath = `${buildPath}/graphql/type-definitions.ts`;

  mkdirSync(`${buildPath}/graphql`, { recursive: true });
  writeFileSync(filePath, typeDefinitionsFile);
};
