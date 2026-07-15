import { DashboardWidgetContainer, type LayoutConfig } from "@sanity/dashboard";
import isNil from "lodash/isNil.js";

import { UpdateItems } from "./update-items.js";

export type DocumentListConfig = {
  apiVersion?: string;
  createButtonText?: string;
  limit?: number;
  order?: string;
  query?: string;
  queryParams?: Record<string, unknown>;

  showCreateButton?: boolean;
  title?: string;
  types?: string[];
};

const UpdateWidget = () => {
  return (
    <DashboardWidgetContainer header="Latest Updates">
      <ul>
        <UpdateItems />
      </ul>
    </DashboardWidgetContainer>
  );
};

export const updateWidget = (config?: { layout: LayoutConfig }) => {
  return {
    component: function component() {
      return <UpdateWidget />;
    },
    ...(!isNil(config?.layout) && { layout: config.layout }),
    name: "update-widget"
  };
};
