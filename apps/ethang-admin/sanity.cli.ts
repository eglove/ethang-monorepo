import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    dataset: "production",
    // eslint-disable-next-line cspell/spellchecker
    projectId: "3rkvshhk",
  },
  deployment: {
    // eslint-disable-next-line cspell/spellchecker
    appId: "kqejv3j30ipyfncm31yh5mu7",
    autoUpdates: true,
  },
});
