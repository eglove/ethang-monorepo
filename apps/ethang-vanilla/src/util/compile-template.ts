// eslint-disable-next-line lodash/import-scope
import _ from "lodash";
import { readFileSync } from "node:fs";

export type CompileTemplateProperties = {
  compileParameters?: object;
  filePath: string;
};

export const compileTemplate = (properties: CompileTemplateProperties) => {
  const html = readFileSync(properties.filePath, "utf8");
  const compile = _.template(html);
  return compile(properties.compileParameters);
};
