import type { NVDAPlaywright } from "@guidepup/playwright";

export const nvdaPress = async (
  nvda: NVDAPlaywright,
  key: string,
  times = 1,
) => {
  for (let index = 0; index < times; index++) {
    await nvda.press(key);
  }
};
