import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    dataset: "production",
    // cspell:disable-next-line
    projectId: "3rkvshhk",
  },
  deployment: {
    // cspell:disable-next-line
    appId: "kqejv3j30ipyfncm31yh5mu7",
    autoUpdates: true,
  },
});
