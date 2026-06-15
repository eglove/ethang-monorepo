import { Flex, Text } from "@radix-ui/themes";

export const NoSubscriptionsFound = () => {
  return (
    <Flex align="center" justify="center" className="py-12">
      <Text size="3" className="text-slate-500">
        No subscriptions found.
      </Text>
    </Flex>
  );
};
