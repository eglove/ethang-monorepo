import { MainLayout, type MainLayoutProperties } from "./main-layout.tsx";

type BlogLayoutProperties = MainLayoutProperties;

export const BlogLayout = async (properties: BlogLayoutProperties) => {
  return (
    <MainLayout {...properties} classNames={{ main: "max-w-[65ch] mx-auto" }} />
  );
};
