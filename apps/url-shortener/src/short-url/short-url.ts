import { HTTP_STATUS } from "@ethang/toolbelt/constants/http";
import isNil from "lodash/isNil";
import { z } from "zod";

import { createUniqueId } from "./create-unique-id.ts";
import { getExistingUrl } from "./get-existing-url.ts";

type ErrorReturn = {
  _status: ErrorStatus;
  errors: {
    message: string;
    path: string[];
  }[];
};

type ErrorStatus =
  | typeof HTTP_STATUS.INTERNAL_SERVER_ERROR
  | typeof HTTP_STATUS.NOT_FOUND;

type SuccessReturn = {
  _links: {
    redirect: { href: string };
    self: { href: string };
  };
  _status: SuccessStatus;
  id: string;
};

type SuccessStatus = typeof HTTP_STATUS.CREATED | typeof HTTP_STATUS.OK;

// eslint-disable-next-line lodash/prefer-lodash-method
const shortUrlSchema = z.object({ id: z.string().trim(), url: z.url().trim() });

export class ShortUrl {
  public constructor(
    private readonly _environment: Cloudflare.Env,
    private readonly _rootUrl: string,
  ) {}

  public async create(url: string): Promise<ErrorReturn | SuccessReturn> {
    const existingUrlId = await getExistingUrl(url, this._environment);

    if ("DOES_NOT_EXIST" === existingUrlId) {
      const shortId = await createUniqueId(this._environment);

      const result = await this._environment.url_shortener.put(
        shortId,
        JSON.stringify({ id: shortId, url }),
      );

      if (isNil(result)) {
        return this.errorReturn(
          "Failed to create short link.",
          ["url"],
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      return this.successReturn(shortId, HTTP_STATUS.CREATED, url);
    }

    if ("FAILED_TO_PARSE" === existingUrlId) {
      return this.errorReturn(
        "Internal Server Error",
        ["url"],
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return this.successReturn(existingUrlId, HTTP_STATUS.CREATED, url);
  }

  public async getById(id: string) {
    const shortUrl = await this._environment.url_shortener.get(id);

    if (isNil(shortUrl)) {
      return this.errorReturn("Not Found", ["id"], HTTP_STATUS.NOT_FOUND);
    }

    const parsed = shortUrlSchema.safeParse(await shortUrl.json());

    if (parsed.error || isNil(parsed.data.url)) {
      return this.errorReturn(
        "Internal Server Error",
        ["id"],
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return this.successReturn(id, HTTP_STATUS.OK, parsed.data.url);
  }

  private errorReturn(message: string, path: string[], status: ErrorStatus) {
    return {
      _status: status,
      errors: [
        {
          message,
          path,
        },
      ],
    };
  }

  private successReturn(id: string, status: SuccessStatus, redirectTo: string) {
    return {
      _links: {
        redirect: { href: redirectTo },
        self: { href: new URL(`/links/${id}`, this._rootUrl).href },
      },
      _status: status,
      id,
    };
  }
}
