import graphql from "@graphql-eslint/eslint-plugin";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(graphql.rules));

const customRules = [
  {
    name: "alphabetize",
    rule: [
      "error",
      {
        arguments: [
          "FieldDefinition",
          "Field",
          "DirectiveDefinition",
          "Directive"
        ],
        definitions: true,
        fields: [
          "ObjectTypeDefinition",
          "InterfaceTypeDefinition",
          "InputObjectTypeDefinition"
        ],
        selections: ["OperationDefinition", "FragmentDefinition"],
        values: true,
        variables: true
      }
    ]
  }
];

export const graphqlRules = genRules(ruleNames, customRules, "graphql");

export const graphqlPlugin = new Plugin({
  files: "**/*.graphql",
  importString: 'import graphql from "@graphql-eslint/eslint-plugin";',
  name: "@graphql-eslint/eslint-plugin",
  pluginName: "graphql",
  pluginValue: "graphql",
  rules: graphqlRules,
  url: "https://github.com/graphql-hive/graphql-eslint"
});
