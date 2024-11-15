import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    dataset: "production",
    // eslint-disable-next-line cspell/spellchecker
    projectId: "j1gcump7",
  },
  autoUpdates: true,
});
