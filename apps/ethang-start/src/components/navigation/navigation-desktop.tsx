import { Button, TopNav, TopNavHeading } from "@astryxdesign/core";

import { NavigationItems } from "./navigation-items.tsx";

export const NavigationDesktop = () => {
  return (
    <div className="hidden md:block">
      <TopNav
        label="Main navigation"
        centerContent={<NavigationItems />}
        heading={<TopNavHeading heading="EthanG" />}
        endContent={
          <div>
            <Button as="a" href="/login" label="Login" variant="primary" />
          </div>
        }
      />
    </div>
  );
};
