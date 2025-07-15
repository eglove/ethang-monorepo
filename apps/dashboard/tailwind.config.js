import { heroui } from "@heroui/react";
import prose from "@tailwindcss/typography";
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
    prose(),
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Noto Sans Mono", ...fontFamily.mono],
        sans: ["Funnel Sans", ...fontFamily.sans],
        serif: ["Funnel Display", ...fontFamily.serif],
      },
    },
  },
};
