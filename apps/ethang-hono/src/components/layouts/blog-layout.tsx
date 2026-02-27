import { MainLayout, type MainLayoutProperties } from "./main-layout.tsx";

type BlogLayoutProperties = MainLayoutProperties;

export const BlogLayout = async (
  properties: Omit<BlogLayoutProperties, "isBlog">,
) => {
  return (
    <MainLayout
      {...properties}
      isBlog={true}
      classNames={{ main: "max-w-[65ch] md:mx-auto" }}
    />
  );
};
