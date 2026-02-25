import { MainLayout } from "../layouts/main-layout.tsx";

export const NotFound = async () => {
  return (
    <MainLayout classNames={{ main: "format format-invert mx-auto" }}>
      <h1 class="text-center">404 Not Found</h1>
      <p class="text-center">The page you are looking for does not exist.</p>
    </MainLayout>
  );
};
