import {
  defineConfig,
  minimal2023Preset
} from "@vite-pwa/assets-generator/config";

const background = "#011627";

export default defineConfig({
  images: ["public/favicon.svg"],
  preset: {
    ...minimal2023Preset,
    apple: {
      resizeOptions: { background, fit: "contain" },
      sizes: [180]
    },
    maskable: {
      resizeOptions: { background, fit: "contain" },
      sizes: [512]
    }
  }
});
