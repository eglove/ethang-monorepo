import "../src/index.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "error",
    },

    controls: {
      matchers: {
        color: /(?:background|color)$/iu,
        date: /date$/iu,
      },
    },
  },
};

export default preview;
