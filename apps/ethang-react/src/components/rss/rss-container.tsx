import { useQuery } from "@apollo/client/react";
import { Box, Card, Heading, Skeleton } from "@radix-ui/themes";
import isNil from "lodash/isNil";

import { Articles } from "./articles.tsx";
import { GET_SUBSCRIPTIONS_WITH_ARTICLES } from "./queries.ts";

export const RssContainer = () => {
  const { data, loading } = useQuery(GET_SUBSCRIPTIONS_WITH_ARTICLES);
  const isPending = loading && isNil(data);

  return (
    <Box className="md:col-span-3">
      <Card className="min-h-75 border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
        <Heading mb="3" size="4" className="text-slate-300">
          Articles
        </Heading>

        <Skeleton loading={isPending} data-testid="articles-skeleton">
          <Articles feedTitle="" />
        </Skeleton>
      </Card>
    </Box>
  );
};
