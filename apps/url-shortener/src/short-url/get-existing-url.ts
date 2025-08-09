import isNil from "lodash/isNil.js";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type GET_EXISTING_URL_RESPONSE = "DOES_NOT_EXIST" | "FAILED_TO_PARSE" | string;

export const getExistingUrl = async (
  url: string,
  environment: Cloudflare.Env,
): Promise<GET_EXISTING_URL_RESPONSE> => {
  const byUrl = await environment.url_shortener.get(url);

  if (isNil(byUrl)) {
    return "DOES_NOT_EXIST";
  }

  const json = z.object({ [url]: z.string() }).safeParse(await byUrl.json());

  if (!isNil(json.error) || isNil(json.data?.[url])) {
    return "FAILED_TO_PARSE";
  }

  return json.data[url];
};
