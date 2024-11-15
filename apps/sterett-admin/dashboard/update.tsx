import type { JSX } from "react";

import {
  type DashboardWidget,
  DashboardWidgetContainer,
  type LayoutConfig,
} from "@sanity/dashboard";

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

const UpdateWidget = (): JSX.Element => {
  return (
    <DashboardWidgetContainer header="Latest Updates">
      <ul>
        <UpdateItems />
      </ul>
    </DashboardWidgetContainer>
  );
};

export const updateWidget = (config?: {
  layout: LayoutConfig;
}): DashboardWidget => {
  return {
    component: function component(): JSX.Element {
      return <UpdateWidget />;
    },
    layout: config?.layout,
    name: "update-widget",
  };
};
