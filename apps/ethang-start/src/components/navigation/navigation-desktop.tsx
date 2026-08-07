import { TopNav, TopNavHeading } from "@astryxdesign/core";

import { AuthButtons } from "./auth-buttons.tsx";
import { NavigationItems } from "./navigation-items.tsx";

export const NavigationDesktop = () => {
  return (
    <div className="hidden md:block">
      <TopNav
        label="Main navigation"
        endContent={<AuthButtons />}
        centerContent={<NavigationItems />}
        heading={<TopNavHeading heading="EthanG" />}
      />
    </div>
  );
};
