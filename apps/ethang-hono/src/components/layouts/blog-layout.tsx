import { MainLayout, type MainLayoutProperties } from "./main-layout.tsx";

type BlogLayoutProperties = MainLayoutProperties;

export const BlogLayout = async (
  properties: Omit<BlogLayoutProperties, "isBlog">,
) => {
  const { prevUrl, nextUrl, ...rest } = properties;

  return (
    <MainLayout
      {...rest}
      isBlog={true}
      classNames={{ main: "max-w-[65ch] md:mx-auto" }}
      {...(prevUrl !== undefined ? { prevUrl } : {})}
      {...(nextUrl !== undefined ? { nextUrl } : {})}
    />
  );
};
