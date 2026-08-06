import { VStack } from "@astryxdesign/core";
import { createFileRoute } from "@tanstack/react-router";

import { HowIWork } from "../components/how-work.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { ProfileCard } from "../components/profile-card.tsx";
import { StackAndTools } from "../components/stack-and-tools.tsx";
import { WhatIveShipped } from "../components/what-ive-shipped.tsx";

export const Route = createFileRoute("/")({
  component: App
});

function App() {
  return (
    <MainLayout>
      <VStack gap={4}>
        <ProfileCard />
        <HowIWork />
        <StackAndTools />
        <WhatIveShipped />
      </VStack>
    </MainLayout>
  );
}
