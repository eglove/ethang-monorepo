import isNil from "lodash/isNil.js";
import { nanoid } from "nanoid";

import Environment = Cloudflare.Env;

export const createUniqueId = async (
  environment: Environment,
): Promise<string> => {
  const id = nanoid(7);

  const byId = await environment.url_shortener.get(id);

  if (isNil(byId)) {
    return id;
  }

  return createUniqueId(environment);
};
