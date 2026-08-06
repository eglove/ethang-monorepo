import { Button, Icon, MobileNav, SideNavSection } from "@astryxdesign/core";
import { useState } from "react";

import { NavigationItems } from "./navigation-items.tsx";

export const NavigationMobile = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="block md:hidden">
      <Button
        isIconOnly
        variant="ghost"
        label="Open Navigation"
        icon={<Icon icon="menu" />}
        onClick={() => {
          setIsOpen(true);
        }}
      />
      <MobileNav
        header="EthanG"
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <SideNavSection title="Main" isHeaderHidden>
          <NavigationItems />
        </SideNavSection>
      </MobileNav>
    </div>
  );
};
