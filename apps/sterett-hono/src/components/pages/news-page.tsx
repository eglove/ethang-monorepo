import map from "lodash/map.js";

import {
  getNewsAndEvents,
  type NewsAndEvents,
} from "../../sanity/get-news-and-events.ts";
import { CalendarEvent } from "../event.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";
import { NewsUpdate } from "../news-update.tsx";

type NewsPageProperties = {
  items?: NewsAndEvents;
};

export const NewsPage = async ({
  items: providedItems,
}: NewsPageProperties = {}) => {
  const items = providedItems ?? (await getNewsAndEvents());
  const updatedAt = map(items, (index) => index._updatedAt)
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1);

  return (
    <MainLayout
      updatedAt={updatedAt}
      title="Sterett Creek Village Trustee | News"
      description="News and Event Updates for Sterett Creek Village Trustee"
    >
      <h1 class="mb-6 text-2xl font-bold tracking-wide">News &amp; Events</h1>
      {0 === items.length ? (
        <p class="text-white/60">No upcoming news or events.</p>
      ) : (
        <div class="flex flex-col gap-4">
          {map(items, async (item) =>
            "startsAt" in item ? (
              <CalendarEvent data={item} key={item._id} />
            ) : (
              <NewsUpdate data={item} key={item._id} />
            ),
          )}
        </div>
      )}
    </MainLayout>
  );
};
