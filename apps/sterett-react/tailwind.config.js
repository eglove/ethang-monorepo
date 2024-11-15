import { nextui } from "@nextui-org/react";
import prose from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",

  plugins: [prose(), nextui()],
  theme: {
    extend: {},
  },
};
