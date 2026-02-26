import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { P } from "../typography/p.tsx";

export const NotFound = async () => {
  return (
    <MainLayout classNames={{ main: "max-w-[65ch] mx-auto" }}>
      <H1 className="text-center">404 Not Found</H1>
      <P className="text-center">
        The page you are looking for does not exist.
      </P>
    </MainLayout>
  );
};
