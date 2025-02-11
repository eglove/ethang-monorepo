import { AddEditApplication } from "@/components/add-edit-application/add-edit-application.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import get from "lodash/get";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { v7 } from "uuid";

const defaultValues = {
  applied: "",
  company: "",
  interviewRounds: [],
  title: "",
  url: "",
};

export const DATE_FORMAT = "yyyy-MM-dd";

const RouteComponent = () => {
  const routerState = useRouterState();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const id = get(routerState, ["location", "search", "id"]) as
    | string
    | undefined;

  const query = useQuery(queries.getApplicationById(id));

  const initialData = isNil(query.data)
    ? defaultValues
    : {
        ...query.data,
        applied: DateTime.fromJSDate(query.data.applied).toFormat(DATE_FORMAT),
        interviewRounds: map(query.data.interviewRounds, (round) => {
          return {
            date: DateTime.fromJSDate(round).toFormat(DATE_FORMAT),
          };
        }),
        rejected: isNil(query.data.rejected)
          ? ""
          : DateTime.fromJSDate(query.data.rejected).toFormat(DATE_FORMAT),
      };

  return <AddEditApplication initialData={initialData} key={v7()} />;
};

export const Route = createFileRoute("/upsert-application")({
  component: RouteComponent,
});
