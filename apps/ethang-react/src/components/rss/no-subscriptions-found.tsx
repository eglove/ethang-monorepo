import { rss } from "@ethang/intl/en/rss.ts";
import { Flex, Text } from "@radix-ui/themes";

export const NoSubscriptionsFound = () => {
  return (
    <Flex align="center" justify="center" className="py-12">
      <Text size="3" className="text-slate-500">
        {rss.NO_SUBSCRIPTIONS}
      </Text>
    </Flex>
  );
};
