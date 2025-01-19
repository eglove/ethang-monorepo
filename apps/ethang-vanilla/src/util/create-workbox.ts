import { generateSW } from "workbox-build";

export const createWorkbox = async () => {
  await generateSW({
    clientsClaim: true,
    globDirectory: "./dist",
    globPatterns: ["**/*.{js,css,html}"],
    skipWaiting: true,
    swDest: "./dist/service-worker.js",
  });
};
