import map from "lodash/map.js";

import { UpdateItem } from "./update-item.js";

const items = [
  {
    children: "Added Beyonder Events",
    date: "03/06/2024",
    id: 0,
  },
  {
    children: "Site upgraded to use QwikJS for performance improvements.",
    date: "12/15/2023",
    id: 1,
  },
  {
    children:
      "New requirement to News Updates for &ldquo;Stop Showing&rdquo; dates. This date will note when news updates should stop showing on the website.",
    date: "08/18/2023",
    id: 2,
  },
  {
    children:
      "Reformatted news page to be in ascending order. Older news and events will no longer show. The color backgrounds on trustees are now randomized.",
    date: "08/02/2023",
    id: 3,
  },
  {
    children:
      "Multiple style changes. Images on pages have a blur effect on load, and show a filtered shadow effect. The news page uses newly styled cards. Links on the files page dim on hover. Trustees cards are styled with image effects. Updated calendar event info popup. Added validation so that the end date of calendar events must come after start dates.",
    date: "08/01/2023",
    id: 4,
  },
  {
    children: (
      <>
        Expanded size of{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://sterettcreekvillagetrustee.com/news"
        >
          News page
        </a>{" "}
        to find a middle ground between mobile/desktop.
      </>
    ),
    date: "07/19/2023",
    id: 5,
  },
  {
    children:
      "Calendar now uses native dialog for popups to help page load faster.",
    id: 6,
  },
  {
    children:
      "News feed auto-scrolls to closest date and uses smaller container optimized for mobile devices.",
    id: 7,
  },
  {
    children: (
      <>
        Style Updates: Home page and calendar text will use same styles via{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://tailwindcss.com/docs/typography-plugin"
        >
          Tailwind Prose.
        </a>
      </>
    ),
    id: 8,
  },
];

export const UpdateItems = () => {
  return (
    <>
      {map(items, (item) => {
        return (
          <UpdateItem key={item.id} date={item.date}>
            {item.children}
          </UpdateItem>
        );
      })}
    </>
  );
};
