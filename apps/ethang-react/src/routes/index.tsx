import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

import { HowIWork } from "../components/how-i-work.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";
import { ProfileCard } from "../components/profile-card.tsx";
import { StackAndTools } from "../components/stack-and-tools.tsx";
import { WhatIveShipped } from "../components/what-ive-shipped.tsx";

const Index = () => {
  return (
    <MainLayout>
      <Flex gap="4" direction="column">
        <ProfileCard />
        <HowIWork />
        <StackAndTools />
        <WhatIveShipped />
      </Flex>
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index
});
