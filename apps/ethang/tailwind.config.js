import { heroui } from "@heroui/react";
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    heroui({
      defaultExtendTheme: "dark",
      defaultTheme: "dark",
    }),
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Noto Sans Mono", ...fontFamily.mono],
        sans: ["Funnel Sans", ...fontFamily.sans],
        // eslint-disable-next-line cspell/spellchecker
        serif: ["Hepta Slab", ...fontFamily.serif],
      },
    },
  },
};
