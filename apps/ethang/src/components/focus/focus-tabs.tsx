import { useStore } from "@ethang/store/use-store";
import { Tab, Tabs } from "@heroui/react";
import convertToString from "lodash/toString.js";

import { focusStore } from "../../stores/focus-store.ts";
import { FocusTabTitle } from "./focus-tab-title.tsx";
import { FocusTab } from "./focus-tab.tsx";
import { InventoryTabTitle } from "./inventory-tab-title.tsx";
import { InventoryTab } from "./inventory-tab.tsx";

export const FocusTabs = () => {
  const selectedTab = useStore(focusStore, (state) => {
    return state.selectedTab;
  });

  return (
    <Tabs
      aria-label="tabs"
      selectedKey={selectedTab}
      onSelectionChange={(value) => {
        focusStore.setSelectedTab(convertToString(value));
      }}
    >
      <Tab key="focus" title={<FocusTabTitle />}>
        <FocusTab />
      </Tab>
      <Tab key="inventory" title={<InventoryTabTitle />}>
        <InventoryTab />
      </Tab>
    </Tabs>
  );
};
