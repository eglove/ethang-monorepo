import { NavbarItem } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import map from "lodash/map";

import { getGalleryImagesCountQueryOptions } from "../../sanity/queries/get-gallery-images-count.ts";
import { noSlash } from "../../utilities/string.ts";
import { Link } from "../link.tsx";

const navUrls = [
  {
    name: "Home",
    url: "/",
  },
  {
    name: "News",
    url: "/news/",
  },
  {
    name: "Calendar",
    url: "/calendar/",
  },
  {
    name: "Files",
    url: "/files/",
  },
  {
    name: "Trustees",
    url: "/trustees/",
  },
];

export const NavigationLinks = () => {
  const { data: imageCount } = useSuspenseQuery(
    getGalleryImagesCountQueryOptions(),
  );

  return (
    <>
      {map(navUrls, (item) => {
        const isActive =
          noSlash(globalThis.location.pathname) === noSlash(item.url);

        return (
          <NavbarItem
            key={item.name}
            isActive={isActive}
            className="text-sky-700"
          >
            <Link href={item.url}>{item.name}</Link>
          </NavbarItem>
        );
      })}
      {1 <= imageCount && (
        <NavbarItem
          key="gallery"
          className="text-sky-700"
          isActive={"/gallery" === globalThis.location.pathname}
        >
          <Link href="/gallery">Pictures</Link>
        </NavbarItem>
      )}
    </>
  );
};
