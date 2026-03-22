import { getPage } from "../../sanity/get-page.ts";
import { MainLayout } from "../layouts/main-layout.tsx";
import { PortableText } from "../portable-text.tsx";

export const HomePage = async () => {
  const pageData = await getPage("home");

  return (
    <MainLayout
      updatedAt={pageData?._updatedAt}
      title="Sterett Creek Village Trustee | Home"
      description="Homepage of the Sterett Creek Village Trustee Board"
    >
      <h1 class="sr-only">Sterett Creek Village Trustee</h1>
      <PortableText content={pageData?.content} />
    </MainLayout>
  );
};
