import { globalStore } from "../../stores/global-store-properties.ts";
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
import { ProfileCard } from "../cards/profile-card.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

export const Home = async () => {
  const { pathname } = globalStore;

  return (
    <MainLayout
      pathname={pathname}
      updatedAt={DEPLOY_TIME}
      classNames={{ main: "mx-auto max-w-7xl" }}
    >
      <ProfileCard />
    </MainLayout>
  );
};
