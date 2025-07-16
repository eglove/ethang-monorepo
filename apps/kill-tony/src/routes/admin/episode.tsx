import { createFileRoute } from "@tanstack/react-router";

import { CreateEpisodeForm } from "../../components/admin/create-episode-form.tsx";

const RouteComponent = () => {
  return (
    <div>
      <CreateEpisodeForm />
    </div>
  );
};

export const Route = createFileRoute("/admin/episode")({
  component: RouteComponent,
});
