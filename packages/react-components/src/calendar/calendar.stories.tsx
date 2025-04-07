import type { Meta, StoryObj } from "@storybook/react";

import times from "lodash/times.js";
import { DateTime } from "luxon";

import { Calendar } from "./calendar.tsx";

const meta = {
  component: Calendar,
} satisfies Meta<typeof Calendar>;

type Story = StoryObj<typeof meta>;

export const Month: Story = {
  args: {
    events: times(2, (index) => {
      return {
        description: <div>Hello</div>,
        end: DateTime.now()
          .plus({ minute: (index + 1) * 30 })
          .toJSDate(),
        // eslint-disable-next-line compat/compat
        id: globalThis.crypto.randomUUID(),
        start: DateTime.now()
          .plus({ minute: index * 30 })
          .toJSDate(),
        title: `Some Title ${index}`,
      };
    }),
  },
};

export default meta;
