import { useStore } from "@ethang/store/use-store";
import { Tab, Tabs } from "@heroui/react";

import { userStore } from "../stores/user-store.ts";

export const NavTabs = () => {
  const currentTab = useStore(userStore, (state) => {
    return state.currentTab;
  });

  return (
    <Tabs
      onSelectionChange={(value) => {
        userStore.setCurrentTab(value.toString());
      }}
      aria-label="Navigation"
      color="primary"
      selectedKey={currentTab}
    >
      <Tab key="videos" title="Videos"></Tab>
    </Tabs>
  );
};
