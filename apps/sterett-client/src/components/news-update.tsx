import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import isNil from "lodash/isNil";

import type { NewsUpdateReturn } from "../sanity/queries/get-news-and-events.ts";

import { SanityContent } from "./sanity/sanity-content.tsx";

type NewsUpdateProperties = {
  readonly data: NewsUpdateReturn;
};

export const NewsUpdate = ({ data }: NewsUpdateProperties) => {
  return (
    <Card id={data._id} className="my-4 h-max w-full">
      <CardHeader className="block">
        <div className="font-semibold">{data.title}</div>
      </CardHeader>
      {!isNil(data.description) && (
        <>
          <Divider />
          <CardBody>
            <SanityContent value={data.description} />
          </CardBody>
        </>
      )}
    </Card>
  );
};
