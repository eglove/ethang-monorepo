import { getPage } from "../../sanity/get-page.ts";
import { MainLayout } from "../layouts/main-layout.tsx";
import { PortableText } from "../portable-text.tsx";

export const HomePage = async () => {
  const pageData = await getPage("home");

  return (
    <MainLayout
      title="Sterett Creek Village Trustee | Home"
      description="Homepage of the Sterett Creek Village Trustee Board"
    >
      <PortableText content={pageData?.content} />
    </MainLayout>
  );
};
