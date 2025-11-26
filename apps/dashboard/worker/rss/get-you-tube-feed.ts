import { XMLParser } from "fast-xml-parser";

type YouTubeChannelFeed = {
  "?xml": string;
  feed: {
    author: {
      name: string;
      uri: string;
    };
    entry: {
      author: {
        name: string;
        uri: string;
      };
      id: string;
      link: string;
      "media:group": {
        "media:community": {
          "media:starRating": string;
          "media:statistics": string;
        };
        "media:content": string;
        "media:description": string;
        "media:thumbnail": string;
        "media:title": string;
      };
      published: string;
      title: string;
      updated: string;
      "yt:channelId": string;
      "yt:videoId": string;
    }[];
    id: string;
    link: string[];
    published: string;
    title: string;
    "yt:channelId": string;
  };
};

const feedRoot = new URL("https://www.youtube.com/feeds/videos.xml");

export const getYouTubeFeed = async (channelId: string) => {
  feedRoot.searchParams.set("channel_id", channelId);
  const response = await fetch(feedRoot);
  const text = await response.text();

  const parser = new XMLParser();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const document = parser.parse(text) as unknown as YouTubeChannelFeed;

  console.log(document.feed);
};
