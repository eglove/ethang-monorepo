import { createFileRoute } from "@tanstack/react-router";

import { CreateEpisodeForm } from "../../components/admin/create-episode-form.tsx";
import { signInStore } from "../../components/admin/sign-in-store.ts";

const RouteComponent = () => {
  return (
    <div>
      <CreateEpisodeForm />
    </div>
  );
};

export const Route = createFileRoute("/admin/episode")({
  beforeLoad: () => {
    if (!signInStore.state.isSignedIn) {
      globalThis.location.href = "/";
    }
  },
  component: RouteComponent,
});
