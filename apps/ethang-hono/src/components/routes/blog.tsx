import { MainLayout } from "../layouts/main-layout.tsx";
import { wtfIsVinextPublished } from "./blog/wtf-is-vinext.tsx";

export const Blog = async () => {
  return (
    <MainLayout classNames={{ main: "format format-invert mx-auto" }}>
      <h1>Blog</h1>
      <div>
        <a href="/blog/wtf-is-vinext">WTF is vinext?</a>
        <p class="m-0 text-sm">
          {wtfIsVinextPublished.toLocaleString(undefined, {
            dateStyle: "medium",
          })}
        </p>
      </div>
    </MainLayout>
  );
};
