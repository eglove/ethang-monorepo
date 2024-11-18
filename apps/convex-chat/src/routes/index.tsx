import "../index.css";

import { createFileRoute, redirect } from "@tanstack/react-router";

const HomeComponent = () => {
  return (
    <div>
      {null}
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: () => {
    redirect({
      from: "/",
      throw: true,
      to: "/conversations",
    });
  },
});
