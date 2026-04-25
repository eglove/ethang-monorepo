import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    dataset: "production",
    projectId: "3rkvshhk",
  },
  deployment: {
    appId: "kqejv3j30ipyfncm31yh5mu7",
    autoUpdates: true,
  },
});
