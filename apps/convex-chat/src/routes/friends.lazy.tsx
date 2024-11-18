import { createLazyFileRoute } from "@tanstack/react-router";

import { FriendInvite } from "../components/friends/friend-invite.tsx";
import { FriendRequests } from "../components/friends/friend-requests.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";

const Friends = () => {
  return (
    <MainLayout>
      <div className="my-4">
        <FriendInvite />
        <FriendRequests />
      </div>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/friends")({
  component: Friends,
});
