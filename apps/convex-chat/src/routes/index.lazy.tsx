import { convexQuery } from "@convex-dev/react-query";

import "../index.css";

import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/spinner";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";

import { api } from "../../convex/_generated/api";

const HomeComponent = () => {
  // @ts-expect-error convex beta
  const { data: tasks, isPending } = useQuery(convexQuery(api.tasks.get, {}));

  return (
    <div className="prose">
      {(isPending as boolean) && <Spinner />}
      {map(tasks, (task) => {
        return (
          <Button key={task._id}>
            {task.text}
          </Button>
        );
      })}
    </div>
  );
};

export const Route = createLazyFileRoute("/")({
  component: HomeComponent,
});
