import { Flex, Text } from "@radix-ui/themes";

import { rss } from "../../constants/rss.ts";

export const NoUnreadArticles = () => {
  return (
    <Flex align="center" justify="center" className="py-12">
      <Text size="3" className="text-slate-500">
        {rss.NO_UNREAD_ARTICLES}
      </Text>
    </Flex>
  );
};
