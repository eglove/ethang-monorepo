import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import toInteger from "lodash/toInteger";

import { getPrismaClient } from "../prisma-client.ts";

type RawNewsResult = {
  News_href: string;
  News_id: string;
  News_published: string; // Or Date, depending on how D1 returns it
  News_quote: null | string;
  News_title: string;
  YouTubeVideo_id: null | string;
  YouTubeVideo_title: null | string;
  YouTubeVideo_url: null | string;
  YouTubeVideo_videoId: null | string;
};

export const getAllNews = async (request: Request, environment: Env) => {
  const prisma = getPrismaClient(environment);
  const url = new URL(request.url);

  const page = toInteger(url.searchParams.get("page") ?? "1");
  const limit = toInteger(url.searchParams.get("limit") ?? "10");

  const total = await prisma.project.count();

  const query = `
    SELECT
      N.id AS News_id,
      N.href AS News_href,
      N.published AS News_published,
      N.quote AS News_quote,
      N.title AS News_title,
      YV.id AS YouTubeVideo_id,
      YV.videoId AS YouTubeVideo_videoId,
      YV.title AS YouTubeVideo_title,
      YV.url AS YouTubeVideo_url
    FROM
      News AS N
    LEFT JOIN
      YouTubeVideo AS YV ON N.id = YV.newsId
    ORDER BY
      N.published DESC
    LIMIT ?;
  `;

  const { results } = await environment.DB.prepare(query)
    .bind(limit)
    .all<RawNewsResult>();

  const formattedNews = map(results, (row) => ({
    href: row.News_href,
    id: row.News_id,
    published: new Date(row.News_published),
    quote: row.News_quote,
    title: row.News_title,
    youtubeVideo: isNil(row.YouTubeVideo_id)
      ? null
      : {
          id: row.YouTubeVideo_id,
          title: row.YouTubeVideo_title,
          url: row.YouTubeVideo_url,
          videoId: row.YouTubeVideo_videoId,
        },
  }));

  return createJsonResponse(
    {
      news: formattedNews,
      pagination: { limit, page, total, totalPages: Math.ceil(total / limit) },
    },
    "OK",
  );
};
