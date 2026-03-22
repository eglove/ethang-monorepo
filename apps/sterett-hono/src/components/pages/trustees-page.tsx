import map from "lodash/map.js";

import { getTrustees } from "../../sanity/get-trustees.ts";
import { MainLayout } from "../layouts/main-layout.tsx";
import { TrusteeCard } from "../trustee-card.tsx";

export const TrusteesPage = async () => {
  const trustees = await getTrustees();

  return (
    <MainLayout
      title="Sterett Creek Village Trustee | Trustees"
      description="Trustee contact information for Sterett Creek Village Trustee Board"
    >
      <h1 class="mb-6 text-2xl font-bold tracking-wide">Trustees</h1>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {map(trustees, async (trustee) => (
          <TrusteeCard key={trustee._id} trustee={trustee} />
        ))}
      </div>
    </MainLayout>
  );
};
