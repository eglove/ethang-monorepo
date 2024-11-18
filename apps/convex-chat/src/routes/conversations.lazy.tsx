import { createLazyFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

const Conversations = () => {
  return (
    <MainLayout>
      <div>
        conversations
      </div>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/conversations")({
  component: Conversations,
});
