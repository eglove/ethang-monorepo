import { AddEditApplication } from "@/components/add-edit-application/add-edit-application.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import get from "lodash/get";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";
import { v7 } from "uuid";

const defaultValues = {
  applied: "",
  company: "",
  title: "",
  url: "",
};

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
        applied: DateTime.fromJSDate(query.data.applied).toFormat("yyyy-MM-dd"),
        rejected: isNil(query.data.rejected)
          ? ""
          : DateTime.fromJSDate(query.data.rejected).toFormat("yyyy-MM-dd"),
      };

  return <AddEditApplication initialData={initialData} key={v7()} />;
};

export const Route = createFileRoute("/upsert-application")({
  component: RouteComponent,
});
