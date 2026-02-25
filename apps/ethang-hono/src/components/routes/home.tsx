import { MainLayout } from "../layouts/main-layout.tsx";

type HomeProperties = {
  pathname: string;
};

export const Home = async (properties: HomeProperties) => {
  return <MainLayout pathname={properties.pathname}></MainLayout>;
};
