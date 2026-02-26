import { ProfileCard } from "../cards/profile-card.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

export const Home = async () => {
  return (
    <MainLayout classNames={{ main: "mx-auto max-w-7xl" }}>
      <ProfileCard />
    </MainLayout>
  );
};
