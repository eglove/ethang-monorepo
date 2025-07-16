import type z from "zod";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  Link,
  Spinner,
} from "@heroui/react";
import { useFetch } from "@hyper-fetch/react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import type { appearancesSchema } from "../../../schemas/appearance-schema.ts";

import killTonyImage from "../../assets/killtony.jpg";
import { getAllEpisodes } from "../../clients/hyper-fetch.ts";

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

const getAppearanceByType = (
  type: "isBucketPull" | "isGuest" | "isRegular",
  appearances: z.output<typeof appearancesSchema>,
) => {
  return map(
    filter(appearances, (appearance) => {
      return appearance[type];
    }),
    (appearance) => {
      return appearance.name;
    },
  );
};

export const Episodes = () => {
  const { data, loading } = useFetch(getAllEpisodes);

  return (
    <div className="grid gap-4 m-4">
      <div className="flex gap-4 items-center mx-auto my-4">
        <Image className="size-20" src={killTonyImage} />
        <h1 className="font-bold text-5xl">KillTony</h1>
      </div>
      {loading && (
        <Card>
          <CardBody className="grid place-items-center">
            <Spinner />
          </CardBody>
        </Card>
      )}
      {!loading &&
        map(data, (episode) => {
          const url = new URL(episode.url);
          const videoId = url.searchParams.get("v");

          const guests = getAppearanceByType("isGuest", episode.appearances);
          const regulars = getAppearanceByType(
            "isRegular",
            episode.appearances,
          );
          const bucketPulls = getAppearanceByType(
            "isBucketPull",
            episode.appearances,
          );

          return (
            <Card key={episode.number}>
              <CardHeader className="flex justify-center">
                <Link
                  isExternal
                  showAnchorIcon
                  className="font-bold text-2xl"
                  href={episode.url}
                  underline="always"
                >
                  {episode.title}
                </Link>
              </CardHeader>
              <CardBody className="grid place-items-center">
                <div className="w-3xl">
                  {!isNil(videoId) && (
                    <LiteYouTubeEmbed id={videoId} title={episode.title} />
                  )}
                </div>
              </CardBody>
              <CardFooter className="grid gap-4">
                {!isEmpty(guests) && (
                  <div>Guests: {formatter.format(guests)}</div>
                )}
                {!isEmpty(regulars) && (
                  <div>Regulars: {formatter.format(regulars)}</div>
                )}
                {!isEmpty(regulars) && (
                  <div>Bucket Pulls: {formatter.format(bucketPulls)}</div>
                )}
              </CardFooter>
            </Card>
          );
        })}
    </div>
  );
};
