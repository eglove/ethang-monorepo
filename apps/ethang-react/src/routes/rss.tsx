import { Flex, Grid } from "@radix-ui/themes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";

import { authStore } from "../components/auth/auth-store.ts";
import { MainLayout } from "../components/layout/main-layout.tsx";
import { AddFeedForm } from "../components/rss/add-feed-form.tsx";
import { Feeds } from "../components/rss/feeds.tsx";
import { RssContainer } from "../components/rss/rss-container.tsx";

const RssComponent = () => {
  return (
    <MainLayout>
      <Flex gap="4" width="100%" direction="column">
        <AddFeedForm />
        <Grid gap="4" columns={{ initial: "1", md: "4" }}>
          <Feeds />
          <RssContainer />
        </Grid>
      </Flex>
    </MainLayout>
  );
};

export const Route = createFileRoute("/rss")({
  beforeLoad: () => {
    const { user } = authStore.state;
    if (isNil(user)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        search: {
          redirect: "/rss"
        },
        to: "/login"
      });
    }
  },
  component: RssComponent
});
