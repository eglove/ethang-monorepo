import map from 'lodash/map.js';
import Parser from 'rss-parser';

const parser = new Parser();

export const fetchAndParseRss = async (feedUrl: string) => {
  try {
    const feed = await parser.parseURL(feedUrl);

    return map(feed.items, item => {
      const pubDate = item.pubDate ?? item.isoDate;
      const content = item.contentSnippet ?? item.content;

      return {
        content,
        publishedAt: pubDate === undefined ? undefined : new Date(pubDate),
        title: item.title ?? '',
        url: item.link ?? '',
      };
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error parsing feed ${feedUrl}:`, error);
    return [];
  }
};
